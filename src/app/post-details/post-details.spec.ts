import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PostDetails } from './post-details'; 
import { PostsService } from '../services/posts.service';
import { AuthService } from '../services/auth';
import { GlobalCountService } from '../services/global';
import { LikesService } from '../services/likes.service';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, NO_ERRORS_SCHEMA, Input } from '@angular/core';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { PostsModel, LikesResponse, AccessPermission } from '../models/posts.interface';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Header } from '../header/header';
import { Comments } from '../comments/comments';

// mocks de componentes standalone
@Component({ selector: 'app-header', template: '', standalone: true })
class MockHeader {}

@Component({ selector: 'app-comments', template: '', standalone: true })
class MockComments {
  @Input() postId: any;
}

// mock data
const mockPost: PostsModel = {
  id: 123,
  author: 'testuser', 
  author_team: 'TeamA',
  title: 'Detalle del Post',
  content: '<p>Contenido</p>',
  excerpt: 'Resumen',
  timestamp: '2025-01-01',
  author_access: AccessPermission.READ_AND_WRITE,
  team_access: AccessPermission.READ_ONLY,
  authenticated_access: AccessPermission.READ_ONLY,
  public_access: AccessPermission.READ_ONLY
};

class MockAuthService {
  private initialUser = { id: 1, username: 'testuser', role: 'BLOGGER', team_id: 'TeamA' };
  user$ = new BehaviorSubject<any>(this.initialUser);
  isLoggedIn = of(true);

  emitUser(user: any): void {
    this.user$.next(user);
  }
}

class MockGlobalCountService {
  private stats = new Map<number, { likeCount: number; commentCount: number }>();
  
  postStats = jasmine.createSpy('postStats').and.callFake(() => ({
    get: (id: number) => this.stats.get(id)
  }));

  updateLikeCount = jasmine.createSpy('updateLikeCount').and.callFake((id: number, count: number) => {
    const current = this.stats.get(id) || { likeCount: 0, commentCount: 0 };
    this.stats.set(id, { ...current, likeCount: count });
  });

  updateCommentCount = jasmine.createSpy('updateCommentCount').and.callFake((id: number, count: number) => {
    const current = this.stats.get(id) || { likeCount: 0, commentCount: 0 };
    this.stats.set(id, { ...current, commentCount: count });
  });
}

describe('PostDetails Component', () => {
  let component: PostDetails;
  let fixture: ComponentFixture<PostDetails>;

  // spies
  let postsService: jasmine.SpyObj<PostsService>;
  let likesService: jasmine.SpyObj<LikesService>;
  let router: jasmine.SpyObj<Router>;
  let authService: MockAuthService;
  let globalCountService: MockGlobalCountService;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  
  let routeParamMapSubject = new BehaviorSubject(convertToParamMap({ id: '123' }));

  beforeEach(async () => {
    authService = new MockAuthService();
    globalCountService = new MockGlobalCountService();
    
    const postsServiceSpy = jasmine.createSpyObj('PostsService', ['getPost']);
    const likesServiceSpy = jasmine.createSpyObj('LikesService', ['getLikesForPost']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);
    // espía para el snackbar con el método open
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    postsServiceSpy.getPost.and.returnValue(of(mockPost));
    
    const mockLikesResponse: LikesResponse = { 
        count: 10, 
        results: [], 
        next: null, 
        previous: null 
    };
    likesServiceSpy.getLikesForPost.and.returnValue(of(mockLikesResponse));
    
    sanitizerSpy.bypassSecurityTrustHtml.and.callFake((val: string) => val);

    await TestBed.configureTestingModule({
      imports: [PostDetails],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: routeParamMapSubject.asObservable() } 
        },
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: AuthService, useValue: authService },
        { provide: GlobalCountService, useValue: globalCountService },
        { provide: LikesService, useValue: likesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(PostDetails, {
      remove: { imports: [Header, Comments] },
      add: { imports: [MockHeader, MockComments] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostDetails);
    component = fixture.componentInstance;

    postsService = TestBed.inject(PostsService) as jasmine.SpyObj<PostsService>;
    likesService = TestBed.inject(LikesService) as jasmine.SpyObj<LikesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });


  describe('Initialization (ngOnInit)', () => {
    it('should fetch post details and update likes on init', () => {
      fixture.detectChanges(); 

      expect(component.postId).toBe(123);
      expect(component.isLoading).toBeFalse();
      expect(component.post).toEqual(mockPost);
      
      expect(postsService.getPost).toHaveBeenCalledWith(123);
      expect(likesService.getLikesForPost).toHaveBeenCalledWith(123);
      expect(globalCountService.updateLikeCount).toHaveBeenCalledWith(123, 10);
    });

    // actualizar el test para verificar el snackBar
    it('should handle error when fetching post fails', () => {
      postsService.getPost.and.returnValue(throwError(() => new Error('Not found')));
      
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.post).toBeNull();
      
      // verificar que se llame al snackbar con el mensaje correcto
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error al cargar el detalle del post', 
        '', 
        { duration: 4000 }
      );
    });

    it('should show snackbar when fetching likes fails', () => {
      // post carga bien pero likes fallan
      likesService.getLikesForPost.and.returnValue(throwError(() => new Error('Likes fail')));
      
      fixture.detectChanges();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error al obtener los likes del post', 
        '', 
        { duration: 4000 }
      );
    });

    it('should set current user data from AuthService', () => {
      fixture.detectChanges();
      
      expect((component as any)['currentUsername']).toBe('testuser');
    });
  });


  describe('Getters (Counts)', () => {
    beforeEach(() => {
        fixture.detectChanges();
        globalCountService.updateLikeCount(123, 50);
        (globalCountService as any).updateCommentCount(123, 5); 
    });

    it('getLikeCount should return value from GlobalCountService', () => {
        expect(component.getLikeCount()).toBe(50);
    });

    it('getCommentCount should return value from GlobalCountService', () => {
        expect(component.getCommentCount()).toBe(5);
    });

    it('should return 0 if postId is null', () => {
        component.postId = null;
        expect(component.getLikeCount()).toBe(0);
        expect(component.getCommentCount()).toBe(0);
    });
  });


  describe('Navigation', () => {
    beforeEach(() => fixture.detectChanges());

    it('goToPosts should navigate to /posts', () => {
      component.goToPosts();
      expect(router.navigate).toHaveBeenCalledWith(['/posts']);
    });

    it('goToEditPost should navigate to edit page if postId exists', () => {
      component.goToEditPost(); 
      expect(router.navigate).toHaveBeenCalledWith(['/posts', 123, 'edit']);
    });

    it('goToEditPost should NOT navigate if postId is null', () => {
      component.postId = null;
      component.goToEditPost();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });


  describe('Permissions: canEdit', () => {
    const setPost = (overrides: Partial<PostsModel>) => {
      component.post = { ...mockPost, ...overrides };
    };

    const simulateUser = (user: any) => {
        authService.emitUser(user);
        fixture.detectChanges();
        if (user) {
            (component as any)['currentUserTeam'] = user.team_id;
            (component as any)['currentUserRole'] = user.role;
        } else {
            (component as any)['currentUserTeam'] = null;
            (component as any)['currentUserRole'] = null;
        }
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return TRUE if current user is the author', () => {
      simulateUser({ id: 1, username: 'testuser', role: 'BLOGGER', team_id: 'TeamA' });
      setPost({ author: 'testuser' }); 
      expect(component.canEdit).toBeTrue();
    });

    it('should return FALSE if user is not author and no other permission applies', () => {
      simulateUser({ id: 99, username: 'Other Guy', role: 'BLOGGER', team_id: 'TeamB' });
      setPost({ 
        author: 'testuser', 
        authenticated_access: AccessPermission.READ_ONLY,
        team_access: AccessPermission.READ_ONLY 
      });
      expect(component.canEdit).toBeFalse();
    });

    it('should return TRUE if current user is ADMIN', () => { 
      simulateUser({ id: 99, username: 'Admin User', role: 'ADMIN', team_id: 'TeamB' });
      setPost({ author: 'testuser' });
      expect(component.canEdit).toBeTrue();
    });

    it('should return TRUE if authenticated_access is Read & Write', () => {
      simulateUser({ id: 99, username: 'Random User', role: 'BLOGGER' });
      setPost({ 
        author: 'testuser', 
        authenticated_access: AccessPermission.READ_AND_WRITE 
      });
      expect(component.canEdit).toBeTrue();
    });

    it('should return TRUE if team_access is R&W and user is in SAME team', () => {
      simulateUser({ id: 99, username: 'Teammate', role: 'BLOGGER', team_id: 'TeamA' });
      setPost({ 
        author: 'testuser', 
        author_team: 'TeamA', 
        team_access: AccessPermission.READ_AND_WRITE 
      });
      expect(component.canEdit).toBeTrue();
    });

    it('should return FALSE if team_access is R&W but user is in DIFFERENT team', () => {
        simulateUser({ id: 99, username: 'Rival', role: 'BLOGGER', team_id: 'TeamB' });
        setPost({ 
          author: 'testuser', 
          author_team: 'TeamA', 
          team_access: AccessPermission.READ_AND_WRITE 
        });
        expect(component.canEdit).toBeFalse();
      });

    it('should return FALSE if user is not logged in', () => {
      simulateUser(null);
      setPost({ author: 'testuser' });
      expect(component.canEdit).toBeFalse();
    });
  });


  describe('HTML Sanitization', () => {
    beforeEach(() => fixture.detectChanges());

    it('getSafeHtml should call sanitizer', () => {
      const html = '<script>alert(1)</script>';
      component.getSafeHtml(html);
      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(html);
    });

    it('getSafeHtml should return empty string if html is undefined', () => {
        const result = component.getSafeHtml(undefined);
        expect(result).toBe('');
    });
  });
});