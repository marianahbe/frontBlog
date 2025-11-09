import { Injectable } from '@angular/core';

export const POSTS_PER_PAGE = 10;
export const COMMENTS_PER_PAGE = 5;
export const LIKES_PER_PAGE = 15;

@Injectable({
  providedIn: 'root'
})

export class PaginationService {

    constructor() { }

    getCurrentPageNumber(url: string | null | undefined): number {
        if (!url) {
            return 1;
        }
        /* Paginador ?page= */
        const paramsString = url.includes('?') ? url.split('?')[1] : '';
        const urlParams = new URLSearchParams(paramsString);
        const page = urlParams.get('page');
        return page ? parseInt(page, 10) : 1;
    }

    getPaginationRange(currentPage: number, pageSize: number, totalItems: number): string {
        if (totalItems === 0 || pageSize === 0) {
            return '';
        }
        const startIndex = (currentPage - 1) * pageSize + 1;
        const endIndex = Math.min(currentPage * pageSize, totalItems);
        return `${startIndex}-${endIndex} de ${totalItems}`;
    }

}