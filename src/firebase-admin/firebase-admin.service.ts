import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";

import { initializeApp, App } from "firebase-admin/app";
import { credential } from "firebase-admin";
import {
	BaseMessage,
	getMessaging,
	Messaging,
	TopicMessage,
} from "firebase-admin/messaging";

import { firebaseConstants } from "../contants";
import { UsersService } from "../users/users.service";
import { UserDto } from "../dto/user.dto";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
	) {}

	private app: App;
	private messaging: Messaging;

	onModuleInit() {
		this.app = initializeApp({
			credential: credential.cert(firebaseConstants.serviceAccountPath),
		});
		this.messaging = getMessaging(this.app);
	}

	async sendByTopic(topic: string, message: BaseMessage): Promise<void> {
		const topicMessage = message as TopicMessage;
		topicMessage.topic = topic;

		await this.messaging.send(topicMessage);
	}

	async updateToken(
		user: UserDto,
		token: string,
	): Promise<{ userDto: UserDto; isNew: boolean }> {
		const isNew = user.fcm === null;

		const fcm = !isNew ? user.fcm : { token: token, topics: [] };
		if (!isNew) {
			if (fcm.token === token) return { userDto: user, isNew: false };

			for (const topic in fcm.topics)
				await this.messaging.subscribeToTopic(token, topic);
			fcm.token = token;
		}

		return {
			userDto: await this.usersService.update({
				where: { id: user.id },
				data: { fcm: fcm },
			}),
			isNew: isNew,
		};
	}

	async unsubscribe(user: UserDto, topics: Set<string>): Promise<UserDto> {
		const fcm = user.fcm;
		const currentTopics = new Set(fcm.topics);

		for (const topic of topics) {
			if (!fcm.topics.includes(topic)) continue;

			await this.messaging.unsubscribeFromTopic(fcm.token, topic);
			currentTopics.delete(topic);
		}
		if (currentTopics.size === fcm.topics.length) return user;

		fcm.topics = Array.from(currentTopics);

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: fcm },
		});
	}

	async subscribe(user: UserDto, topics: Set<string>): Promise<UserDto> {
		const fcm = user.fcm;
		const currentTopics = new Set(fcm.topics);

		for (const topic of topics) {
			if (fcm.topics.includes(topic)) continue;

			await this.messaging.subscribeToTopic(fcm.token, topic);
			currentTopics.add(topic);
		}
		if (currentTopics.size === fcm.topics.length) return user;

		fcm.topics = Array.from(currentTopics);

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: fcm },
		});
	}

	async updateApp(
		userDto: UserDto,
		version: string,
		topics: Set<string>,
	): Promise<void> {
		await this.subscribe(userDto, topics).then(async (userDto) => {
			await this.usersService.update({
				where: { id: userDto.id },
				data: { version: version },
			});
		});
	}
}
