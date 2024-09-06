import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class ObjectIdPipe implements PipeTransform<any, string> {
	transform(value: any): string {
		if (
			value === null ||
			value === undefined ||
			typeof value !== "string" ||
			value.length !== 24
		)
			throw new BadRequestException("Invalid ObjectId");

		const return_string = value.toLowerCase();
		if (!/^[0-9a-f]{24}$/.test(return_string))
			throw new BadRequestException("Invalid ObjectId");

		return return_string;
	}
}
