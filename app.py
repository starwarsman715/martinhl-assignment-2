from flask import Flask, render_template, jsonify, request
from kmeans import KMeans
import numpy as np

app = Flask(__name__)

kmeans_instance = None
current_k = None
has_converged = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_data', methods=['POST'])
def generate_data():
    global kmeans_instance, current_k, has_converged
    kmeans_instance = None
    current_k = None
    has_converged = False
    num_points = 100
    data = np.random.rand(num_points, 2) * 100
    print(f"Generated {num_points} data points")
    return jsonify(data.tolist())

@app.route('/run_kmeans_step', methods=['POST'])
def run_kmeans_step():
    global kmeans_instance, current_k, has_converged
    data = np.array(request.json['data'])
    k = int(request.json['k'])
    init_method = request.json['initMethod']
    step = request.json['step']
    initial_centroids = request.json.get('initialCentroids')

    print(f"Running KMeans step. Method: {init_method}, K: {k}, Step: {step}")

    if step == 0 or kmeans_instance is None or k != current_k:
        kmeans_instance = KMeans(k=k, init_method=init_method)
        current_k = k
        has_converged = False
        if init_method == 'manual' and initial_centroids:
            kmeans_instance.centroids = np.array(initial_centroids)
        else:
            kmeans_instance.initialize(data)
    
    if not has_converged:
        has_converged = not kmeans_instance.step(data)

    result = {
        'centroids': kmeans_instance.centroids.tolist(),
        'labels': kmeans_instance.labels.tolist(),
        'step': step + 1,
        'converged': has_converged
    }
    print(f"Step result: {len(result['centroids'])} centroids, {len(result['labels'])} labels, Converged: {has_converged}")
    return jsonify(result)

@app.route('/run_kmeans_converge', methods=['POST'])
def run_kmeans_converge():
    global kmeans_instance, current_k, has_converged
    data = np.array(request.json['data'])
    k = int(request.json['k'])
    init_method = request.json['initMethod']
    initial_centroids = request.json.get('initialCentroids')

    print(f"Running KMeans converge. Method: {init_method}, K: {k}")

    if not has_converged:
        kmeans_instance = KMeans(k=k, init_method=init_method)
        current_k = k
        if init_method == 'manual' and initial_centroids:
            kmeans_instance.centroids = np.array(initial_centroids)
        
        kmeans_instance.fit(data)
        has_converged = True

    result = {
        'centroids': kmeans_instance.centroids.tolist(),
        'labels': kmeans_instance.labels.tolist(),
        'step': kmeans_instance.n_iter
    }
    print(f"Converge result: {len(result['centroids'])} centroids, {len(result['labels'])} labels, {result['step']} steps")
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=3000, debug=True)
