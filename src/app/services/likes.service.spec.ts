import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LikesService } from './likes.service';
import { LikesResponse, LikeToggleResponse, LikesModel } from '../models/posts.interface';

const mockLikeModel: LikesModel = {
  id: 10,
  user_id: 1,
  post: 15,
  username: 'testuser'
};

const mockLikeModel2: LikesModel = {
  id: 11,
  user_id: 2,
  post: 15,
  username: 'anotheruser'
};

const mockLikesResponse: LikesResponse = {
  count: 2,
  next: 'next_page_url',
  previous: null,
  results: [
    mockLikeModel, 
    mockLikeModel2, 
  ]
};

const mockLikeToggleResponseLiked: LikeToggleResponse = {
  liked: true,
  detail: 'Me gusta añadido'
};

const mockLikeToggleResponseUnliked: LikeToggleResponse = {
    liked: false,
    detail: 'Me gusta eliminado'
};

describe('LikesService', () => {
  let service: LikesService;
  let httpTestingController: HttpTestingController;
  const postId = 15;
  const baseUrl = 'https://blogproject-hu3j.onrender.com/post/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), // HttpClient base
        provideHttpClientTesting(), // Mockea el HttpClient
        LikesService]
    });
    service = TestBed.inject(LikesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLikesForPost', () => {
    it ('should get list of likes for a post', () => {
      const expectedUrl = `${baseUrl}${postId}/likes/`;
      service.getLikesForPost(postId).subscribe(response => {
        // Aserciones 
        expect(response).toEqual(mockLikesResponse);
        expect(response.results.length).toBe(2);
        expect(response.results[0].username).toBe('testuser');
      });
      // Captura la petición 
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('GET');
      // Responde con los datos simulados para que se desbloquee la suscripción 
      req.flush(mockLikesResponse);
    });

    it ('shoul use the pagination Url if provided', () => {
      const pageUrl = 'https://blogproject-hu3j.onrender.com/post/15/likes/?page=2';
      service.getLikesForPost(postId, pageUrl).subscribe(response => {
        expect(response.next).toBe(null);
      });
      const req = httpTestingController.expectOne(pageUrl);
      expect(req.request.method).toEqual('GET');
      const mockPage2R = { ...mockLikesResponse, next: null, results: [] };
      req.flush(mockPage2R);
    });
  });

  describe('toggleLike', () => {
    const expectedUrl = `${baseUrl}${postId}/like/`;

    it('should send post to add a like and recive LikeToggleResponse with liked: true', () => {
      service.toggleLike(postId).subscribe(response => {
        expect(response).toEqual(mockLikeToggleResponseLiked);
        expect(response.liked).toBeTrue();
        expect(response.detail).toContain('añadido');
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({}); 
      req.flush(mockLikeToggleResponseLiked); 
    });

    it('should sen post to remove like and receive LikeToggleResponse with liked: false', () => {
        service.toggleLike(postId).subscribe(response => {
          expect(response).toEqual(mockLikeToggleResponseUnliked);
          expect(response.liked).toBeFalse();
          expect(response.detail).toContain('eliminado');
        });
  
        const req = httpTestingController.expectOne(expectedUrl);
        expect(req.request.method).toEqual('POST');
        req.flush(mockLikeToggleResponseUnliked); 
    });
  });

});
