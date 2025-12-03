import { TestBed } from '@angular/core/testing';
import { GlobalCountService } from './global';

// Verifica que los métodos manipulen bien el map y postStats muestra los cambios

describe('Global', () => {
  let service: GlobalCountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalCountService);
  });

  afterEach(() => {
    service['_postCounts'].set(new Map());
    (service as any)._postCounts.set(new Map());
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('postStats should initialize as an empty map', () => {
    expect(service.postStats().size).toBe(0);
  });

  describe('updateLikeCount', () => {
    const postId = 1;
    
    it ('should set likeCount for a new post', () => {
      service.updateLikeCount(postId, 5);
      const stats = service.postStats();
      expect(stats.get(postId)).toEqual({ likeCount: 5, commentCount: 0 });
      expect(stats.size).toBe(1);
    });

    it ('should update likeCount for an existing post', () => {
      service.updateLikeCount(postId, 5);
      service.updateCommentCount(postId, 10);
      service.updateLikeCount(postId, 8);

      const stats = service.postStats();
      // el commentCount se queda igual
      expect(stats.get(postId)).toEqual({ likeCount: 8, commentCount: 10 });
      expect(stats.size).toBe(1);
    });

    it('should update likeCount to 0', () => {
      service.updateLikeCount(postId, 5);
      service.updateLikeCount(postId, 0);

      const stats = service.postStats();
      expect(stats.get(postId)?.likeCount).toBe(0);
    });

    it('should handle posts independently', () => {
        const postId1 = 10;
        const postId2 = 20;

        service.updateLikeCount(postId1, 12);
        service.updateLikeCount(postId2, 24);
        
        const stats = service.postStats();
        expect(stats.get(postId1)?.likeCount).toBe(12);
        expect(stats.get(postId2)?.likeCount).toBe(24);
        expect(stats.size).toBe(2);
    });
  });

  describe('updateCommentCount', () => {
    const postId = 2;

    it('should set commentCount for a new post', () => {
      service.updateCommentCount(postId, 5);
      const stats = service.postStats();
      expect(stats.get(postId)).toEqual({ likeCount: 0, commentCount: 5 });
      expect(stats.size).toBe(1);
    });

    it('should update commentCount for an existing post', () => {
      service.updateLikeCount(postId, 15);
      service.updateCommentCount(postId, 5);
      service.updateCommentCount(postId, 20);

      const stats = service.postStats();
      expect(stats.get(postId)).toEqual({ likeCount: 15, commentCount: 20 });
      expect(stats.size).toBe(1);
    });
  });

  describe('should be able to update both counters', () => {
    const postId = 3;

    it('debería inicializar y actualizar ambos contadores', () => {
      service.updateLikeCount(postId, 36);
      
      const stats1 = service.postStats();
      expect(stats1.get(postId)).toEqual({ likeCount: 36, commentCount: 0 });

      service.updateCommentCount(postId, 13);

      const stats2 = service.postStats();
      expect(stats2.get(postId)).toEqual({ likeCount: 36, commentCount: 13 });
    });
  });
});
