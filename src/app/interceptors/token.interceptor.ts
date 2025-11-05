import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        /* Token en localStorage */
        const token = localStorage.getItem('token');

        /* Si hay un token se clona la solicitud y añade el encabezado de autorización */
        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Token ${token}`
                }
            });
        }

        /* Se pasa la solicitud modificada (o la original si no hay token) */
        return next.handle(request); 
    }
}