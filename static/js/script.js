// Initialize global variables
let chart;
let data = [];
let centroids = []; // Initialize as an empty array
let labels = [];
let currentStep = 0;
let hasConverged = false;

// Function to initialize the Chart.js scatter plot
function initChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Data Points',
                    data: [], // No global backgroundColor here
                    // backgroundColor: 'rgba(0, 0, 255, 0.5)', // Removed
                    pointRadius: 5
                },
                {
                    label: 'Centroids',
                    data: [],
                    backgroundColor: 'rgba(255, 0, 0, 1)',
                    pointRadius: 8,
                    pointStyle: 'triangle' // Make centroids distinguishable
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 100
                },
                y: {
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const x = context.parsed.x;
                            const y = context.parsed.y;
                            return `${label}: (${x.toFixed(2)}, ${y.toFixed(2)})`;
                        }
                    }
                }
            }
        }
    });
    console.log('Chart initialized');
}

// Function to generate new data points by calling the backend
function generateData() {
    console.log('Generating new data');
    fetch('/generate_data', { method: 'POST' })
        .then(response => response.json())
        .then(newData => {
            data = newData;
            centroids = []; // Reset centroids
            labels = [];    // Reset labels
            currentStep = 0;
            hasConverged = false;
            console.log(`Generated ${data.length} data points`);
            updateChart();
            updateStatus('New data generated. Click Step to start clustering.');
            updateButtonStates();
        })
        .catch(error => console.error('Error generating data:', error));
}

// Function to update the chart with current data and centroids
function updateChart() {
    console.log('Updating chart');
    
    // Update data points without backgroundColor
    chart.data.datasets[0].data = data.map((point) => ({
        x: point[0],
        y: point[1],
    }));
    
    // Assign backgroundColor as an array based on labels
    if (labels && labels.length === data.length) {
        chart.data.datasets[0].backgroundColor = labels.map(label => getColor(label));
    } else {
        // Default color if labels are not yet assigned
        chart.data.datasets[0].backgroundColor = Array(data.length).fill('rgba(0, 0, 255, 0.5)');
    }
    
    // Update centroids
    chart.data.datasets[1].data = centroids.map(point => ({
        x: point[0],
        y: point[1]
    }));
    
    chart.update();
    console.log(`Chart updated with ${data.length} points and ${centroids.length} centroids`);
}

// Function to get color based on cluster label
function getColor(label) {
    const colors = [
        'rgba(255, 99, 132, 0.6)',    // Red
        'rgba(54, 162, 235, 0.6)',    // Blue
        'rgba(255, 206, 86, 0.6)',    // Yellow
        'rgba(75, 192, 192, 0.6)',    // Green
        'rgba(153, 102, 255, 0.6)',   // Purple
        'rgba(255, 159, 64, 0.6)',    // Orange
        'rgba(199, 199, 199, 0.6)',   // Grey
        'rgba(83, 102, 255, 0.6)',    // Indigo
        'rgba(255, 102, 255, 0.6)',   // Magenta
        'rgba(102, 255, 102, 0.6)'    // Light Green
    ];
    return colors[label % colors.length];
}

// Function to update the state of buttons based on current conditions
function updateButtonStates() {
    const initMethod = document.getElementById('initMethod').value;
    const k = parseInt(document.getElementById('kClusters').value);
    const stepButton = document.getElementById('step');
    const convergeButton = document.getElementById('converge');

    if (initMethod === 'manual') {
        const isReady = centroids.length === k;
        stepButton.disabled = !isReady;
        convergeButton.disabled = !isReady;
        updateStatus(isReady ? 'Ready to start clustering' : `Place ${k - centroids.length} more centroid(s)`);
    } else {
        stepButton.disabled = false;
        convergeButton.disabled = false;
    }
}

// Function to run a single step of KMeans
function runKMeansStep() {
    if (!data || hasConverged) return;
    
    const initMethod = document.getElementById('initMethod').value;
    const k = parseInt(document.getElementById('kClusters').value);

    if (initMethod === 'manual' && centroids.length !== k) {
        updateStatus(`Place ${k - centroids.length} more centroid(s) before starting`);
        return;
    }

    fetch('/run_kmeans_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: data,
            k: k,
            initMethod: initMethod,
            step: currentStep,
            initialCentroids: initMethod === 'manual' ? centroids : null
        }),
    })
    .then(response => response.json())
    .then(result => {
        centroids = result.centroids;
        labels = result.labels;
        currentStep = result.step;
        hasConverged = result.converged;
        console.log('Received labels:', labels); // Debugging line
        updateChart();
        updateStatus(hasConverged ? 'KMeans has converged!' : `Step ${currentStep} completed`);
    })
    .catch(error => console.error('Error in KMeans step:', error));
}

// Function to run KMeans to convergence
function runKMeansConverge() {
    if (!data || hasConverged) return;
    
    const initMethod = document.getElementById('initMethod').value;
    const k = parseInt(document.getElementById('kClusters').value);

    if (initMethod === 'manual' && centroids.length !== k) {
        updateStatus(`Place ${k - centroids.length} more centroid(s) before starting`);
        return;
    }

    fetch('/run_kmeans_converge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: data,
            k: k,
            initMethod: initMethod,
            initialCentroids: initMethod === 'manual' ? centroids : null
        }),
    })
    .then(response => response.json())
    .then(result => {
        centroids = result.centroids;
        labels = result.labels;
        currentStep = result.step;
        hasConverged = true;
        console.log('Received labels:', labels); // Debugging line
        updateChart();
        updateStatus('KMeans has converged!');
    })
    .catch(error => console.error('Error in KMeans converge:', error));
}

// Function to reset the clustering state
function reset() {
    centroids = [];
    labels = [];
    currentStep = 0;
    hasConverged = false;
    updateChart();
    updateStatus('Reset complete. Generate new data or try different initialization methods.');
    updateButtonStates();
}

// Function to update the status message
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners to buttons
    document.getElementById('generateData').addEventListener('click', generateData);
    document.getElementById('step').addEventListener('click', runKMeansStep);
    document.getElementById('converge').addEventListener('click', runKMeansConverge);
    document.getElementById('reset').addEventListener('click', reset);
    document.getElementById('initMethod').addEventListener('change', updateButtonStates);
    document.getElementById('kClusters').addEventListener('change', updateButtonStates);

    // Attach event listener to the chart canvas for manual centroid placement
    document.getElementById('chart').addEventListener('click', (event) => {
        const initMethod = document.getElementById('initMethod').value;
        const k = parseInt(document.getElementById('kClusters').value);

        if (initMethod !== 'manual') return;

        // Calculate the mouse position relative to the canvas
        const rect = chart.canvas.getBoundingClientRect();
        const xPixel = event.clientX - rect.left;
        const yPixel = event.clientY - rect.top;

        // Convert pixel position to chart data values
        const xValue = chart.scales.x.getValueForPixel(xPixel);
        const yValue = chart.scales.y.getValueForPixel(yPixel);

        // Add centroid if we haven't reached k
        if (centroids.length < k) {
            centroids.push([xValue, yValue]);
            updateChart();
            updateStatus(`Centroid ${centroids.length} of ${k} placed`);
            updateButtonStates();
        } else {
            updateStatus(`All ${k} centroids have been placed`);
        }
    });

    // Initialize the chart and generate initial data
    initChart();
    generateData();
    updateButtonStates();
});
