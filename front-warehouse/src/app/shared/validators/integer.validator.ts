import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export const integerValidator: ValidatorFn = (
  control: AbstractControl<number | null>,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined) {
    return null;
  }
  return Number.isInteger(value) ? null : { integer: true };
};
