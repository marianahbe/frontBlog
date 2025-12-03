import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Posts } from './posts';
import { PostsService } from '../services/posts.service';
import { AuthService } from '../services/auth';
import { PaginationService } from '../services/pagination.service';
import { GlobalCountService } from '../services/global';
import { LikesService } from '../services/likes.service';
import { CommentsService } from '../services/comments.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElementRef, ChangeDetectorRef, NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { AccessPermission, PostsModel, PostsResponse, LikesResponse, LikesModel } from '../models/posts.interface';
import { Header } from '../header/header';
import { Likes } from '../likes/likes';

@Component({ selector: 'app-header', template: '', standalone: true })
class MockHeader {}

@Component({ selector: 'app-likes', template: '', standalone: true })
class MockLikes {}

const mockPost: PostsModel = {
  id: 1,
  author: 'testuser',
  author_team: 'TeamA',
  title: 'Test Post',
  content: '<p>Contenido del post</p>',
  excerpt: '<p>Resumen</p>',
  timestamp: '2025-01-01T00:00:00Z',
  author_access: AccessPermission.READ_AND_WRITE,
  team_access: AccessPermission.READ_AND_WRITE,
  authenticated_access: AccessPermission.READ_ONLY,
  public_access: AccessPermission.READ_ONLY
};

const mockPostOtherUser: PostsModel = {
  ...mockPost,
  id: 2,
  author: 'Other User',
  author_team: 'Team B',
  author_access: AccessPermission.READ_AND_WRITE,
  team_access: AccessPermission.READ_ONLY,
  authenticated_access: AccessPermission.READ_ONLY
};

const mockCompletePost = {
  ...mockPost,
  showLikers: false,
  isLiked: false,
  likers: [],
  comment_count: 0,
  isTruncated: false
};

class MockAuthService {
  private initialUser = { id: 1, username: 'testuser', role: 'BLOGGER', team_id: 'TeamA' };
  user$ = new BehaviorSubject<any>(this.initialUser);
  isLoggedIn = of(true);
  emitUser(user: any): void { this.user$.next(user); }
  emitError(err: any): void { this.user$.error(err); }
}

class MockGlobalCountService {
  private stats = new Map<number, { likeCount: number; commentCount: number }>();
  postStats = jasmine.createSpy('postStats').and.callFake(() => ({ get: (id: number) => this.stats.get(id) }));
  updateLikeCount = jasmine.createSpy('updateLikeCount').and.callFake((id: number, count: number) => {
    const current = this.stats.get(id) || { likeCount: 0, commentCount: 0 };
    this.stats.set(id, { ...current, likeCount: count });
  });
  updateCommentCount = jasmine.createSpy('updateCommentCount').and.callFake((id: number, count: number) => {
    const current = this.stats.get(id) || { likeCount: 0, commentCount: 0 };
    this.stats.set(id, { ...current, commentCount: count });
  });
}

describe('Posts Component', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;
  let postsService: jasmine.SpyObj<PostsService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let likesService: jasmine.SpyObj<LikesService>;
  let authServiceMockInstance: MockAuthService;

  beforeEach(async () => {
    authServiceMockInstance = new MockAuthService();

    const postsServiceSpy = jasmine.createSpyObj('PostsService', ['getPosts', 'deletePost']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const paginationServiceSpy = jasmine.createSpyObj('PaginationService', ['getCurrentPageNumber', 'getPaginationRange']);
    const globalCountServiceMock = new MockGlobalCountService();
    const likesServiceSpy = jasmine.createSpyObj('LikesService', ['getLikesForPost', 'toggleLike']);
    const commentsServiceSpy = jasmine.createSpyObj('CommentsService', ['getCommentCountForPost']);
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    postsServiceSpy.getPosts.and.returnValue(of({ count: 0, results: [], next: null, previous: null } as PostsResponse));
    postsServiceSpy.deletePost.and.returnValue(of({}));
    paginationServiceSpy.getCurrentPageNumber.and.returnValue(1);
    paginationServiceSpy.getPaginationRange.and.returnValue('0-0 de 0');
    commentsServiceSpy.getCommentCountForPost.and.returnValue(of(0));
    likesServiceSpy.getLikesForPost.and.returnValue(of({ count: 0, results: [], next: null, previous: null } as LikesResponse));
    sanitizerSpy.bypassSecurityTrustHtml.and.callFake((val: string) => val);

    await TestBed.configureTestingModule({
      imports: [Posts, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() }, queryParams: of({}), fragment: of(null)} },
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: AuthService, useValue: authServiceMockInstance },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PaginationService, useValue: paginationServiceSpy },
        { provide: GlobalCountService, useValue: globalCountServiceMock },
        { provide: LikesService, useValue: likesServiceSpy },
        { provide: CommentsService, useValue: commentsServiceSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: ElementRef, useValue: { nativeElement: { contains: () => true } } },
        ChangeDetectorRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(Posts, {
      remove: { imports: [Header, Likes, MatSnackBarModule] },
      add: { imports: [MockHeader, MockLikes] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Posts);
    component = fixture.componentInstance;
    postsService = TestBed.inject(PostsService) as jasmine.SpyObj<PostsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    likesService = TestBed.inject(LikesService) as jasmine.SpyObj<LikesService>;
  });

  describe('ngOnInit', () => {
    it('should load user data and then posts on init', () => {
      fixture.detectChanges();
      expect((component as any)['currentUsername']).toBe('testuser');
      expect(postsService.getPosts).toHaveBeenCalled();
    });

    it('should load posts even if user data fetching errors out', () => {
      authServiceMockInstance.emitError(new Error('Auth Error'));
      fixture.detectChanges();
      expect(postsService.getPosts).toHaveBeenCalled();
    });
  });

  describe('Functional Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    describe('loadPosts', () => {
      it('should update posts, call fetchAndUpdateLikes and getCommentCountForPost for each post', () => {
        (postsService.getPosts as jasmine.Spy).and.returnValue(of({
          count: 1, next: 'next-url', previous: 'prev-url', results: [mockPost]
        }));
        (likesService.getLikesForPost as jasmine.Spy).calls.reset();
        const commentsService = TestBed.inject(CommentsService) as jasmine.SpyObj<CommentsService>;
        commentsService.getCommentCountForPost.calls.reset();
        component.loadPosts();
        expect(component.totalPosts).toBe(1);
        expect(component.posts.length).toBe(1);
        expect(likesService.getLikesForPost).toHaveBeenCalledWith(mockPost.id);
        expect(commentsService.getCommentCountForPost).toHaveBeenCalledWith(mockPost.id);
      });

      it('should show snackbar on posts loading error', () => {
        (postsService.getPosts as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
        component.loadPosts();
        expect(snackBar.open).toHaveBeenCalledWith('Error al cargar los posts, inténtalo de nuevo', '', jasmine.anything());
      });
    });

    describe('onDelete', () => {
      beforeEach(() => {
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(component, 'canEditOrDelete').and.returnValue(true);
        spyOn(component, 'loadPosts');
      });

      it('should delete post when user confirms', () => {
        component.onDelete(mockPost);
        expect(postsService.deletePost).toHaveBeenCalledWith(mockPost.id);
        expect(component.loadPosts).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith('Publicación eliminada con éxito', '', jasmine.anything());
      });

      it('should show access denied snackbar if cannotEditOrDelete is false', () => {
        (component.canEditOrDelete as jasmine.Spy).and.returnValue(false);
        component.onDelete(mockPostOtherUser);
        expect(snackBar.open).toHaveBeenCalledWith('Acceso denegado', '', jasmine.anything());
        expect(postsService.deletePost).not.toHaveBeenCalled();
      });

      it('should show error snackbar on deletePost failure', () => {
        (postsService.deletePost as jasmine.Spy).and.returnValue(throwError(() => new Error('Delete Error')));
        component.onDelete(mockPost);
        expect(postsService.deletePost).toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith('Error al eliminar la publicación, inténtalo de nuevo', '', jasmine.anything());
      });
    });

    describe('onLike and fetchAndUpdateLikes', () => {
      const mockLikesModel: LikesModel = { id: 10, user_id: 1, post: 1, username: 'testuser' };
      const likesResponseLiked: LikesResponse = { count: 1, results: [mockLikesModel], next: null, previous: null };
      const likesResponseNotLiked: LikesResponse = { count: 0, results: [], next: null, previous: null };

      beforeEach(() => {
        component.posts = [{ ...mockCompletePost, id: 1, isLiked: false }];
        (likesService.toggleLike as jasmine.Spy).calls.reset();
        (likesService.getLikesForPost as jasmine.Spy).calls.reset();
        (snackBar.open as jasmine.Spy).calls.reset();
        (component as any)['currentUsername'] = 'testuser';
      });

      it('should update isLiked to true after a successful like toggle', () => {
        (likesService.toggleLike as jasmine.Spy).and.returnValue(of({ liked: true, detail: 'ok' }));
        (likesService.getLikesForPost as jasmine.Spy).and.returnValue(of(likesResponseLiked));
        component.onLike(mockPost);
        expect(component.posts[0].isLiked).toBeTrue();
        expect(snackBar.open).toHaveBeenCalledWith('Me gusta añadido', '', jasmine.anything());
      });

      it('should update isLiked to false after a successful unlike toggle', () => {
        component.posts[0].isLiked = true;
        (likesService.toggleLike as jasmine.Spy).and.returnValue(of({ liked: false, detail: 'ok' }));
        (likesService.getLikesForPost as jasmine.Spy).and.returnValue(of(likesResponseNotLiked));
        component.onLike(mockPost);
        expect(component.posts[0].isLiked).toBeFalse();
        expect(snackBar.open).toHaveBeenCalledWith('Me gusta eliminado', '', jasmine.anything());
      });

      it('should show snackbar if user is not authenticated', () => {
        (component as any)['currentUsername'] = null;
        component.onLike(mockPost);
        expect(snackBar.open).toHaveBeenCalledWith('Debes iniciar sesión para dar Me gusta', '', jasmine.anything());
      });
    });

    describe('canEditOrDelete', () => {
      beforeEach(() => {
        (component as any)['currentUsername'] = 'testuser';
        (component as any)['currentUserId'] = 1;
        (component as any)['currentUserRole'] = 'BLOGGER';
        (component as any)['currentUserTeam'] = 'TeamA';
      });

      it('should return true if current user is the author', () => {
        expect(component.canEditOrDelete(mockPost)).toBeTrue();
      });
    });

    describe('Likers and Close Logic', () => {
      beforeEach(() => {
        component.posts = [
          { ...mockCompletePost, id: 1, showLikers: false },
          { ...mockCompletePost, id: 2, showLikers: true },
          { ...mockCompletePost, id: 3, showLikers: false }
        ];
      });

      it('toggleLikers should close all others and open the selected one', () => {
        const postToToggle = component.posts[0];
        component.toggleLikers(postToToggle);
        expect(component.posts[0].showLikers).toBeTrue();
        expect(component.posts[1].showLikers).toBeFalse();
      });

      it('closeAllLikers should close the first found open likers box', () => {
        component.closeAllLikers();
        expect(component.posts[1].showLikers).toBeFalse();
      });

      it('handleClick should close likers when clicking outside .likes-container', () => {
        component.posts[1].showLikers = true;
        const mockTarget = document.createElement('div');
        spyOn(mockTarget, 'closest').and.returnValue(null);
        const event = { target: mockTarget } as unknown as Event;
        (TestBed.inject(ElementRef) as any).nativeElement.contains = () => true;
        component.handleClick(event);
        expect(component.posts[1].showLikers).toBeFalse();
      });
    });

    describe('HTML Content and Truncation', () => {
      it('getSafeHtml should use DomSanitizer', () => {
        const html = '<div></div>';
        component.getSafeHtml(html);
        const sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
        expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(html);
      });

      it('getPlainTextLength should return correct length for HTML content', () => {
        const mockTempDiv = {
          innerHTML: '',
          textContent: 'Hola Mundo',
          trim: () => 'Hola Mundo'
        };
        spyOn(document, 'createElement').and.returnValue(mockTempDiv as unknown as HTMLElement);
        const length = (component as any).getPlainTextLength('<p>   Hola <b>Mundo</b>  </p>');
        expect(length).toBe(10);
      });

      it('isExcerptTruncated should return true if content is longer than excerpt', () => {
        const post: PostsModel = {
          ...mockPost,
          content: '<p>Este es un contenido muy largo.</p>',
          excerpt: '<p>Resumen</p>'
        };
        spyOn((component as any), 'getPlainTextLength').and.returnValues(30, 7);
        expect(component.isExcerptTruncated(post)).toBeTrue();
      });

      it('isExcerptTruncated should return false if content is not longer than excerpt', () => {
        const post: PostsModel = {
          ...mockPost,
          content: '<p>Contenido corto</p>',
          excerpt: '<p>Contenido corto</p>'
        };
        spyOn((component as any), 'getPlainTextLength').and.returnValues(15, 15);
        expect(component.isExcerptTruncated(post)).toBeFalse();
      });
    });
  });
});
