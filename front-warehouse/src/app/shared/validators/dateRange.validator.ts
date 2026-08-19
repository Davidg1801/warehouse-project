import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export const dateRangeValidator: ValidatorFn = (
  control: AbstractControl<number | null>,
): ValidationErrors | null => {
  const dateFrom = control.get('dateFrom')?.value;
  const dateTo = control.get('dateTo')?.value;

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return { dateRangeInvalid: true };
  }
  return null;
};
