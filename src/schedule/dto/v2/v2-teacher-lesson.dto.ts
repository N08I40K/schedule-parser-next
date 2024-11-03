import { V2LessonDto } from "./v2-lesson.dto";
import { IsOptional, IsString } from "class-validator";
import { NullIf } from "../../../utility/class-validators/conditional-field";
import { V2LessonType } from "../../enum/v2-lesson-type.enum";

export class V2TeacherLessonDto extends V2LessonDto {
	/**
	 * Название группы
	 * @example "ИС-214/23"
	 * @optional
	 */
	@IsString()
	@IsOptional()
	@NullIf((self: V2TeacherLessonDto) => {
		return self.type === V2LessonType.BREAK;
	})
	group: string | null;
}
