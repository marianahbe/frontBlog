import { TestBed } from '@angular/core/testing';
import { POSTS_PER_PAGE, COMMENTS_PER_PAGE, LIKES_PER_PAGE } from './pagination.service';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('pagination constants should be correctly defined', () => {
    expect(POSTS_PER_PAGE).toBe(10);
    expect(COMMENTS_PER_PAGE).toBe(5);
    expect(LIKES_PER_PAGE).toBe(15);
  });

  describe('getCurrentPageNumber', () => {
    it('should return 1 if the URL is null, undefined or empty', () => {
      expect(service.getCurrentPageNumber(null)).toBe(1);
      expect(service.getCurrentPageNumber(undefined)).toBe(1);
      expect(service.getCurrentPageNumber('')).toBe(1);
    });

    it('should return 1 if the URL has no parameters', () => {
      const url = 'https://blogproject-hu3j.onrender.com/posts/';
      expect(service.getCurrentPageNumber(url)).toBe(1);
    });

    it('should return the right number of pages if it is in the url', () => {
      const url = 'https://blogproject-hu3j.onrender.com/posts/?page=5&limit=10';
      expect(service.getCurrentPageNumber(url)).toBe(5);
    });

    it('should return 1 if the parameter page is in the url but empty or invalid', () => {
        const url = 'https://blogproject-hu3j.onrender.com/posts/?page=invalid';
        // URLSearchParams.get('page') retorna 'invalid' parseInt('invalid', 10) regresa NaN pero el servicio devuelve 1
        expect(service.getCurrentPageNumber(url)).toBe(1);
    });

    it('should handle URL with parameters befor the page parameter', () => {
      const url = 'https://blogproject-hu3j.onrender.com/posts/?sort=date&page=3&query=test';
      expect(service.getCurrentPageNumber(url)).toBe(3);
    });
  });

  describe('getPaginationRange', () => {
    const totalItems = 50;
    const pageSize = POSTS_PER_PAGE; // 10

    it('should return an empty string if there are no elements', () => {
      expect(service.getPaginationRange(1, 10, 0)).toBe('');
    });
    
    it('should calculate the range for the first page (1-10 de 50)', () => {
      const currentPage = 1;
      expect(service.getPaginationRange(currentPage, pageSize, totalItems)).toBe('1-10 de 50');
    });

    it('should calculate the range for an intermediate page (31-40 de 50)', () => {
      const currentPage = 4;
      expect(service.getPaginationRange(currentPage, pageSize, totalItems)).toBe('31-40 de 50');
    });

    it('should calculate the range for the last page (91-100 de 100)', () => {
      const currentPage = 5;
      expect(service.getPaginationRange(currentPage, pageSize, totalItems)).toBe('41-50 de 50');
    });

    it('should calculate the range for a page half done in the end (11-12 de 12)', () => {
      const totalItemsPartial = 12;
      const currentPage = 2; // Segunda página con 2 elementos
      expect(service.getPaginationRange(currentPage, pageSize, totalItemsPartial)).toBe('11-12 de 12');
    });

    it("should handle the case that thre's just one page (1-5 de 5)", () => {
      const totalItemsSinglePage = 5;
      const customPageSize = COMMENTS_PER_PAGE; // 5
      const currentPage = 1;
      expect(service.getPaginationRange(currentPage, customPageSize, totalItemsSinglePage)).toBe('1-5 de 5');
    });
  });
});
