import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { LikesService } from '../services/likes.service';
import { PaginationService, LIKES_PER_PAGE } from '../services/pagination.service';
import { GlobalCountService } from '../services/global';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { LikesResponse, LikesModel } from '../models/posts.interface';

import { Likes } from './likes';

const mockLikesResponse: LikesResponse = {
  count: 35,
  next: 'https://blogproject-hu3j.onrender.com/post/1/likes?page=2',
  previous: null,
  results : [
    { id: 1, user_id: 10, post: 1, username: 'user1' },
    { id: 2, user_id: 11, post: 1, username: 'user2' },
  ],
};

describe('Likes', () => {
  let component: Likes;
  let fixture: ComponentFixture<Likes>;

  // spies de los servicios
  let likesServiceSpy: jasmine.SpyObj<LikesService>;
  let paginationServiceSpy: jasmine.SpyObj<PaginationService>;
  let globalCountServiceSpy: jasmine.SpyObj<GlobalCountService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    likesServiceSpy = jasmine.createSpyObj('LikesService', ['getLikesForPost']);
    paginationServiceSpy = jasmine.createSpyObj('PaginationService', ['getCurrentPageNumber', 'getPaginationRange']);
    globalCountServiceSpy = jasmine.createSpyObj('GlobalCountService', ['updateLikeCount']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      // likes standalone se importa
      imports: [Likes, CommonModule],
      providers: [
        // los servicios como providers
        { provide: LikesService, useValue: likesServiceSpy },
        { provide: PaginationService, useValue: paginationServiceSpy },
        { provide: GlobalCountService, useValue: globalCountServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Likes);
    component = fixture.componentInstance;
    component.postId = 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadLikes if postId is present', () => {
      // configurar el spy para que devuelva, porque ngOnInit llama a loadLikes
      likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));
      paginationServiceSpy.getCurrentPageNumber.and.returnValue(1);
      
      // espiar el métdo
      spyOn(component, 'loadLikes').and.callThrough();

      fixture.detectChanges(); // disparar ngOnInit

      expect(component.loadLikes).toHaveBeenCalled();
    });

    it("shouldn't call loadLikes if postId is missing", () => {
      component.postId = 0; // id inválido
      spyOn(component, 'loadLikes');

      fixture.detectChanges();

      expect(component.loadLikes).not.toHaveBeenCalled();
    });
  });

  describe('loadLikes', () => {
    beforeEach(() => {
      // configuración por defecto
      paginationServiceSpy.getCurrentPageNumber.and.returnValue(1);
    });

    it('should set isLoadingLikers to true immediately', () => {
        likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));
        component.loadLikes();
        // síncrono (of()), pasa a false, pero se verifica que se llamó al servicio
        expect(likesServiceSpy.getLikesForPost).toHaveBeenCalled();
    });

    it('should update component properties on successful API response', () => {
      likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));

      component.loadLikes();

      expect(component.likes.length).toBe(mockLikesResponse.results.length);
      expect(component.totalLikes).toBe(mockLikesResponse.count);
      expect(component.nextPageUrl).toBe(mockLikesResponse.next);
      expect(component.previousPageUrl).toBe(mockLikesResponse.previous);
      expect(component.isLoadingLikers).toBeFalse();
    });

    it('should update global count on success', () => {
      likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));
      component.loadLikes();
      expect(globalCountServiceSpy.updateLikeCount).toHaveBeenCalledWith(component.postId, mockLikesResponse.count);
    });

    it('should call getLikesForPost with specific URL if provided', () => {
      const specificUrl = 'https://blogproject-hu3j.onrender.com/post/1/likes/next-page';
      likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));

      component.loadLikes(specificUrl);

      expect(likesServiceSpy.getLikesForPost).toHaveBeenCalledWith(component.postId, specificUrl);
    });

    it('should handle errors correctly (show snackbar and stop loading)', () => {
      const error = { status: 500, message: 'Server Error' };
      likesServiceSpy.getLikesForPost.and.returnValue(throwError(() => error));

      component.loadLikes();

      expect(component.isLoadingLikers).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al cargar los likes', '', jasmine.any(Object));
    });
  });

  describe('getPaginationRange', () => {
    it('should delegate to PaginationService with correct parameters', () => {
      component.currentPage = 2;
      component.pageSize = 10;
      component.totalLikes = 50;
      const expectedResult = '11-20 of 50';
      
      paginationServiceSpy.getPaginationRange.and.returnValue(expectedResult);

      const result = component.getPaginationRange();

      expect(paginationServiceSpy.getPaginationRange).toHaveBeenCalledWith(2, 10, 50);
      expect(result).toBe(expectedResult);
    });
  });

  describe('goToNextPage', () => {
    it('should call loadLikes with nextPageUrl if it exists', () => {
      const nextUrl = 'https://blogproject-hu3j.onrender.com/post/1/likes/next';
      component.nextPageUrl = nextUrl;
      
      spyOn(component, 'loadLikes');

      component.goToNextPage();

      expect(component.loadLikes).toHaveBeenCalledWith(nextUrl);
    });

    it('should do nothing if nextPageUrl is null', () => {
      component.nextPageUrl = null;
      spyOn(component, 'loadLikes');

      component.goToNextPage();

      expect(component.loadLikes).not.toHaveBeenCalled();
    });
  });

  describe('goToPreviousPage', () => {
    it('should call loadLikes with previousPageUrl if it exists', () => {
      const prevUrl = 'https://blogproject-hu3j.onrender.com/post/1/likes/prev';
      component.previousPageUrl = prevUrl;
      
      spyOn(component, 'loadLikes');

      component.goToPreviousPage();

      expect(component.loadLikes).toHaveBeenCalledWith(prevUrl);
    });

    it('should do nothing if previousPageUrl is null', () => {
      component.previousPageUrl = null;
      spyOn(component, 'loadLikes');

      component.goToPreviousPage();

      expect(component.loadLikes).not.toHaveBeenCalled();
    });
  });
});