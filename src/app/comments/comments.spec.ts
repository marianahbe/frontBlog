import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { CommentsService } from '../services/comments.service';
import { PaginationService, COMMENTS_PER_PAGE } from '../services/pagination.service';
import { GlobalCountService } from '../services/global';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { CommentsResponse, CommentsModel } from '../models/posts.interface';

import { Comments } from './comments';

// Mock de datos para respuestas
const mockCommentsResponse: CommentsResponse = {
  count: 10,
  next: 'https://blogproject-hu3j.onrender.com/post/7/comments/?page=2', 
  previous: null,
  results: [
    { id: 1, user_id: 101, post: 1, username: 'user1', content: 'Comentario 1', timestamp: '2023-01-01' },
    { id: 2, user_id: 102, post: 1, username: 'user2', content: 'Comentario 2', timestamp: '2023-01-02' },
  ],
};

const mockNewComment: CommentsModel = {
  id: 3, user_id: 99, post: 1, username: 'user3', content: 'Nuevo comentario', timestamp: '2023-01-03'
};

describe('Comments', () => {
  let component: Comments;
  let fixture: ComponentFixture<Comments>;

  // spies de los servicios
  let commentsServiceSpy: jasmine.SpyObj<CommentsService>;
  let paginationServiceSpy: jasmine.SpyObj<PaginationService>;
  let globalCountServiceSpy: jasmine.SpyObj<GlobalCountService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    commentsServiceSpy = jasmine.createSpyObj('CommentsService', ['getCommentsForPost', 'createComment', 'deleteComment']);
    paginationServiceSpy = jasmine.createSpyObj('PaginationService', ['getCurrentPageNumber', 'getPaginationRange']);
    globalCountServiceSpy = jasmine.createSpyObj('GlobalCountService', ['updateCommentCount']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: of(true)
    });

    await TestBed.configureTestingModule({
      imports: [Comments, CommonModule],
      providers: [
        { provide: CommentsService, useValue: commentsServiceSpy },
        { provide: PaginationService, useValue: paginationServiceSpy },
        { provide: GlobalCountService, useValue: globalCountServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    })
    .overrideComponent(Comments, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Comments);
    component = fixture.componentInstance;
    component.postId = 1; // id del post por defecto
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set authenticated status and call loadComments', () => {
      commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));
      paginationServiceSpy.getCurrentPageNumber.and.returnValue(1);
      
      spyOn(component, 'loadComments').and.callThrough();

      fixture.detectChanges(); // ejecuta ngOnInit

      expect(component.isUserAuthenticated$).toBeDefined();
      expect(component.loadComments).toHaveBeenCalled();
    });
  });

  describe('loadComments', () => {
    beforeEach(() => {
      paginationServiceSpy.getCurrentPageNumber.and.returnValue(1);
    });

    it('should return early if postId is missing', () => {
      component.postId = 0 as any; // forzar falso
      component.loadComments();
      expect(commentsServiceSpy.getCommentsForPost).not.toHaveBeenCalled();
    });

    it('should set isLoading to true and fetch comments', () => {
      commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));
      
      component.loadComments();
      
      expect(component.isLoading).toBeFalse(); // como es sync of() pasa de inmediato a false rápido entonces se verifica la llamada
      expect(commentsServiceSpy.getCommentsForPost).toHaveBeenCalledWith(component.postId, undefined);
    });

    it('should update component properties on successful API response', () => {
      commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));

      component.loadComments();

      expect(component.comments.length).toBe(mockCommentsResponse.results.length);
      expect(component.totalComments).toBe(mockCommentsResponse.count);
      expect(component.nextPageUrl).toBe(mockCommentsResponse.next);
      expect(component.previousPageUrl).toBe(mockCommentsResponse.previous);
      expect(component.isLoading).toBeFalse();
    });

    it('should update global count on success', () => {
      commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));
      component.loadComments();
      expect(globalCountServiceSpy.updateCommentCount).toHaveBeenCalledWith(component.postId, mockCommentsResponse.count);
    });

    it('should handle errors correctly (show snackbar and stop loading)', () => {
      commentsServiceSpy.getCommentsForPost.and.returnValue(throwError(() => new Error('Error')));

      component.loadComments();

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Error al cargar los comentarios', '', jasmine.any(Object));
    });
  });

  describe('submitComment', () => {
    beforeEach(() => {
        // mockear loadComments para que no falle cuando se llame
        commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));
    });

    afterEach(() => {
      // asegurar desinstalar el reloj para no afectar otros tests
      try {
        jasmine.clock().uninstall();
      } catch(e) {}
    });

    it('should not submit if content is empty', () => {
      component.newCommentContent = '   '; // espacios vacíos
      component.submitComment();
      expect(commentsServiceSpy.createComment).not.toHaveBeenCalled();
    });

    it('should create comment successfully and reload list', () => {
      jasmine.clock().install(); // instalar el reloj de Jasmine

      component.newCommentContent = 'Nuevo comentario';
      commentsServiceSpy.createComment.and.returnValue(of(mockNewComment));
      spyOn(component, 'loadComments').and.callThrough();

      component.submitComment();

      expect(commentsServiceSpy.createComment).toHaveBeenCalledWith(component.postId, 'Nuevo comentario');
      expect(component.newCommentContent).toBe(''); // limpia input
      expect(component.highlightedCommentId).toBe(mockNewComment.id);
      expect(component.loadComments).toHaveBeenCalled();
      expect(component.isSubmittingComment).toBeFalse();

      // avanzar el reloj de Jasmine 2000ms
      jasmine.clock().tick(2000);
      
      expect(component.highlightedCommentId).toBeNull();
    });

    it('should handle error on creation', () => {
      component.newCommentContent = 'Texto fallido';
      commentsServiceSpy.createComment.and.returnValue(throwError(() => new Error('Fail')));

      component.submitComment();

      expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringMatching(/Error al enviar/), '', jasmine.any(Object));
      expect(component.isSubmittingComment).toBeFalse();
      // no debería borrar el texto si falla para que el usuario reintente
      expect(component.newCommentContent).toBe('Texto fallido'); 
    });
  });

  describe('cancelCommentCreation', () => {
    it('should reset content and submitting flag', () => {
      component.newCommentContent = 'Texto a cancelar';
      component.isSubmittingComment = true;

      component.cancelCommentCreation();

      expect(component.newCommentContent).toBe('');
      expect(component.isSubmittingComment).toBeFalse();
    });
  });

  describe('deleteComment', () => {
    it('should delete successfully and reload comments', () => {
      const commentIdToDelete = 123;
      commentsServiceSpy.deleteComment.and.returnValue(of(void 0));
      // mockear reload
      commentsServiceSpy.getCommentsForPost.and.returnValue(of(mockCommentsResponse));
      spyOn(component, 'loadComments');

      component.deleteComment(commentIdToDelete);

      expect(commentsServiceSpy.deleteComment).toHaveBeenCalledWith(commentIdToDelete);
      expect(snackBarSpy.open).toHaveBeenCalledWith('Comentario eliminado con éxito', '', jasmine.any(Object));
      expect(component.loadComments).toHaveBeenCalledWith(component.currentPageUrl);
    });

    it('should handle error on delete', () => {
      const commentIdToDelete = 123;
      commentsServiceSpy.deleteComment.and.returnValue(throwError(() => new Error('Delete failed')));

      component.deleteComment(commentIdToDelete);

      expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringMatching(/Error al eliminar/), '', jasmine.any(Object));
    });
  });

  describe('Pagination Logic', () => {
    it('getPaginationRange should delegate to PaginationService', () => {
      component.currentPage = 2;
      component.pageSize = COMMENTS_PER_PAGE;
      component.totalComments = 50;
      const expectedRange = '11-20 of 50';
      
      paginationServiceSpy.getPaginationRange.and.returnValue(expectedRange);

      const result = component.getPaginationRange();

      expect(paginationServiceSpy.getPaginationRange).toHaveBeenCalledWith(2, COMMENTS_PER_PAGE, 50);
      expect(result).toBe(expectedRange);
    });

    it('goToNextPage should call loadComments with nextUrl', () => {
      const nextUrl = 'https://blogproject-hu3j.onrender.com/post/7/comments/next';
      component.nextPageUrl = nextUrl;
      spyOn(component, 'loadComments');

      component.goToNextPage();

      expect(component.loadComments).toHaveBeenCalledWith(nextUrl);
    });

    it('goToPreviousPage should call loadComments with prevUrl', () => {
      const prevUrl = 'https://blogproject-hu3j.onrender.com/post/7/comments/prev';
      component.previousPageUrl = prevUrl;
      spyOn(component, 'loadComments');

      component.goToPreviousPage();

      expect(component.loadComments).toHaveBeenCalledWith(prevUrl);
    });
  });
});