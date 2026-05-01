import { z } from 'zod';

import { hasNumber, isValidEmail, isValidPhone } from './validation';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => isValidEmail(value), { message: 'Enter a valid email address.' }),
  password: z.string().min(1, 'Password is required.'),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(3, 'First name must contain at least 3 characters.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    email: z
      .string()
      .trim()
      .refine((value) => isValidEmail(value), { message: 'Enter a valid email address.' }),
    phone: z
      .string()
      .trim()
      .min(10, 'Phone number must contain at least 10 digits.')
      .refine((value) => isValidPhone(value), {
        message: 'Phone number contains invalid characters.',
      }),
    address: z.string().trim().min(6, 'Address must contain at least 6 characters.'),
    password: z
      .string()
      .min(6, 'Password must contain at least 6 characters.')
      .refine((value) => hasNumber(value), {
        message: 'Password must include at least one number.',
      }),
    confirmPassword: z.string().min(6, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
