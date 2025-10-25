import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.get('password') || !control.get('passwordConf')){
        return null;
    }

    const password = control.get('password');
    const passwordConf = control.get('passwordConf');

    if (password && passwordConf && password.value !== passwordConf.value){
        passwordConf.setErrors({passwordMismatch: true});
        return { passwordMismatch: true}; // Se regresa el error en el FormGroup
    } else if ( passwordConf && passwordConf.hasError('passwordMismatch')){
        passwordConf.setErrors(null);
    }

    return null;
}