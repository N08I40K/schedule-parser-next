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

import { User } from "../users/entity/user.entity";
import { TokenMessage } from "firebase-admin/lib/messaging/messaging-api";
import { FcmUser } from "../users/entity/fcm-user.entity";
import { plainToInstance } from "class-transformer";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
	) {}

	private app: App;
	private messaging: Messaging;

	private readonly defaultTopics = new Set(["common"]);

	onModuleInit() {
		this.app = initializeApp({
			credential: credential.cert(firebaseConstants.serviceAccountPath),
		});
		this.messaging = getMessaging(this.app);
	}

	async sendByTopic(topic: string, message: BaseMessage): Promise<void> {
		const topicMessage = message as TopicMessage;
		topicMessage.topic = topic;

		await this.send(topicMessage);
	}

	async send(message: TopicMessage | TokenMessage): Promise<void> {
		await this.messaging.send(message);
	}

	private getFcmOrDefault(user: User, token: string): FcmUser {
		if (!user.fcm) {
			return plainToInstance(FcmUser, {
				token: token,
				topics: [],
			} as FcmUser);
		}

		return user.fcm;
	}

	async updateToken(
		user: User,
		token: string,
	): Promise<{ userDto: User; isNew: boolean }> {
		const isNew = user.fcm === null;
		const fcm = this.getFcmOrDefault(user, token);

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

	async unsubscribe(user: User, topics: Set<string>): Promise<User> {
		if (!user.fcm) throw new Error("User does not have fcm data!");

		const fcm = user.fcm;
		const newTopics = new Set<string>();

		for (const topic of topics) {
			if (!fcm.topics.includes(topic)) continue;

			await this.messaging.unsubscribeFromTopic(fcm.token, topic);
			newTopics.add(topic);
		}
		if (newTopics.size === fcm.topics.length) return user;

		fcm.topics = Array.from(newTopics);

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: fcm },
		});
	}

	async subscribe(
		user: User,
		topics: Set<string>,
		force: boolean = false,
	): Promise<User> {
		const additionalTopics = new Set([...this.defaultTopics, ...topics]);

		const fcm = user.fcm;
		const newTopics = new Set(fcm.topics);

		for (const topic of additionalTopics) {
			if (force)
				await this.messaging.unsubscribeFromTopic(fcm.token, topic);
			else if (fcm.topics.includes(topic)) continue;
			else newTopics.add(topic);

			await this.messaging.subscribeToTopic(fcm.token, topic);
		}
		if (newTopics.size === fcm.topics.length) return user;

		fcm.topics = Array.from(newTopics);

		return await this.usersService.update({
			where: { id: user.id },
			data: { fcm: fcm },
		});
	}

	async updateApp(user: User, version: string): Promise<void> {
		await this.subscribe(user, new Set(), true).then(async (userDto) => {
			await this.usersService.update({
				where: { id: userDto.id },
				data: { version: version },
			});
		});
	}
}
