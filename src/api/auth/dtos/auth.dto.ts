import { z } from "zod";
import { user_type } from "../../../models/user.model"; // user_type을 model에서 가져옵니다.

// 회원가입 검증 스키마
export const registerUserSchema = z.object({
  // email: 문자열이어야 하고, 이메일 형식이어야 함
  email: z
    .string({ required_error: "이메일은 필수입니다." })
    .email({ message: "올바른 이메일 형식이 아닙니다." }),

  // password: 8자 이상, 영문/숫자/특수문자 포함
  password: z
    .string()
    .min(8, { message: "비밀번호는 8자 이상이어야 합니다." })
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/, {
      message: "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.",
    }),

  // name: 2~20자 문자열
  name: z
    .string()
    .min(2, { message: "닉네임은 2자 이상이어야 합니다." })
    .max(20, { message: "닉네임은 20자 이하이어야 합니다." }),

  // user_type: 'artist', 'student', 'teacher' 중 하나
  user_type: z.enum(["artist", "student", "teacher"], {
    errorMap: () => ({ message: "올바른 사용자 유형을 선택해주세요." }),
  }),

  // 약관 동의: 반드시 true여야 함
  agree_terms: z.literal(true, {
    errorMap: () => ({ message: "이용약관에 동의해야 합니다." }),
  }),
  agree_privacy: z.literal(true, {
    errorMap: () => ({ message: "개인정보 처리방침에 동의해야 합니다." }),
  }),

  // 마케팅 동의: boolean (선택 사항)
  agree_marketing: z.boolean().optional(),
});

// 스키마로부터 TypeScript 타입 자동 추론
export type RegisterUserDto = z.infer<typeof registerUserSchema>;
