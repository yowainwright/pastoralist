export type FieldValidator = (value: unknown) => boolean;

export type FieldValidation = {
  field: string;
  validator: FieldValidator;
};
