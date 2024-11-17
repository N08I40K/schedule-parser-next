import { LessonDto } from "./lesson.dto";
import { IsOptional, IsString } from "class-validator";
import { NullIf } from "../../utility/class-validators/conditional-field";
import { V2LessonType } from "../enum/v2-lesson-type.enum";

export class TeacherLessonDto extends LessonDto {
	/**
	 * Название группы
	 * @example "ИС-214/23"
	 * @optional
	 */
	@IsString()
	@IsOptional()
	@NullIf((self: TeacherLessonDto) => {
		return self.type === V2LessonType.BREAK;
	})
	group: string | null;
}
