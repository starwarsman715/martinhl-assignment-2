import numpy as np

class KMeans:
    def __init__(self, k=3, max_iters=100, init_method='random'):
        self.k = k
        self.max_iters = max_iters
        self.init_method = init_method
        self.centroids = None
        self.labels = None
        self.n_iter = 0

    def initialize(self, X):
        if self.init_method == 'random':
            self.centroids = X[np.random.choice(X.shape[0], self.k, replace=False)]
        elif self.init_method == 'farthest_first':
            self.centroids = self._farthest_first(X)
        elif self.init_method == 'kmeans++':
            self.centroids = self._kmeans_plus_plus(X)

    def fit(self, X):
        self.initialize(X)
        for _ in range(self.max_iters):
            old_centroids = self.centroids.copy()
            self.labels = self._assign_labels(X)
            self._update_centroids(X)
            self.n_iter += 1
            if np.all(old_centroids == self.centroids):
                break

    def step(self, X):
        if self.centroids is None:
            self.initialize(X)
        else:
            old_centroids = self.centroids.copy()
            self.labels = self._assign_labels(X)
            self._update_centroids(X)
            self.n_iter += 1
            if np.all(old_centroids == self.centroids):
                return False
        return True

    def _farthest_first(self, X):
        centroids = [X[np.random.choice(X.shape[0])]]
        for _ in range(1, self.k):
            dists = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            centroids.append(X[np.argmax(dists)])
        return np.array(centroids)

    def _kmeans_plus_plus(self, X):
        centroids = [X[np.random.choice(X.shape[0])]]
        for _ in range(1, self.k):
            dists = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            probs = dists**2 / np.sum(dists**2)
            centroids.append(X[np.random.choice(X.shape[0], p=probs)])
        return np.array(centroids)

    def _assign_labels(self, X):
        return np.array([np.argmin([np.linalg.norm(x - c) for c in self.centroids]) for x in X])

    def _update_centroids(self, X):
        for i in range(self.k):
            if np.sum(self.labels == i) > 0:
                self.centroids[i] = np.mean(X[self.labels == i], axis=0)

    def predict(self, X):
        return self._assign_labels(X)