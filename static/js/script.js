const featureNames = [
    "mean radius", "mean texture", "mean perimeter", "mean area", "mean smoothness",
    "mean compactness", "mean concavity", "mean concave points", "mean symmetry",
    "mean fractal dimension", "radius error", "texture error", "perimeter error",
    "area error", "smoothness error", "compactness error", "concavity error",
    "concave points error", "symmetry error", "fractal dimension error",
    "worst radius", "worst texture", "worst perimeter", "worst area",
    "worst smoothness", "worst compactness", "worst concavity",
    "worst concave points", "worst symmetry", "worst fractal dimension"
];

function createInputForm() {
    const form = document.getElementById('inputForm');
    featureNames.forEach(feature => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        const label = document.createElement('label');
        label.textContent = feature;
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.id = feature.replace(/ /g, '_');
        input.className = 'form-control';
        input.placeholder = feature;
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        form.appendChild(formGroup);
    });
}

createInputForm();

async function predict() {
    const inputData = {};
    featureNames.forEach(feature => {
        inputData[feature] = parseFloat(document.getElementById(feature.replace(/ /g, '_')).value);
    });

    const response = await fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
    });

    const result = await response.json();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <h4>Predicted Class: <span class="badge ${result.prediction === 1 ? 'bg-danger' : 'bg-success'}">${result.prediction === 1 ? 'Malignant' : 'Benign'}</span></h4>
        <div class="progress">
            <div class="progress-bar ${result.prediction === 1 ? 'bg-danger' : 'bg-success'}" role="progressbar" style="width: ${result.probability * 100}%;" aria-valuenow="${result.probability * 100}" aria-valuemin="0" aria-valuemax="100">${(result.probability * 100).toFixed(2)}%</div>
        </div>
        <p class="mt-2">Probability of Malignancy: ${(result.probability * 100).toFixed(2)}%</p>
    `;
}

async function showMetrics() {
    document.getElementById('metrics').style.display = 'block';
    const response = await fetch('/metrics');
    const metrics = await response.json();

    document.getElementById('accuracy').textContent = `${(metrics.accuracy * 100).toFixed(2)}%`;

    const ctx = document.getElementById('confusionMatrix').getContext('2d');
    const cm = metrics.confusion_matrix;
    const data = [
        {x: 0, y: 0, v: cm[0][0]},
        {x: 1, y: 0, v: cm[0][1]},
        {x: 0, y: 1, v: cm[1][0]},
        {x: 1, y: 1, v: cm[1][1]}
    ];
    const maxValue = Math.max(...cm.flat());

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Confusion Matrix',
                data: data,
                backgroundColor: (context) => {
                    const value = context.raw.v;
                    const alpha = value / maxValue;
                    return `rgba(66, 135, 245, ${alpha})`;
                },
                pointRadius: 30,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5,
                    max: 1.5,
                    ticks: {
                        callback: (value) => ['Predicted Benign', 'Predicted Malignant'][value]
                    }
                },
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: 1.5,
                    ticks: {
                        callback: (value) => ['Actual Benign', 'Actual Malignant'][1 - value]
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Count: ${context.raw.v}`
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value) => value.v
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    const reportDiv = document.getElementById('classificationReport');
    reportDiv.innerHTML = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-score</th>
                    <th>Support</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(metrics.classification_report).slice(0, -3).map(([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${value.precision.toFixed(2)}</td>
                        <td>${value.recall.toFixed(2)}</td>
                        <td>${value['f1-score'].toFixed(2)}</td>
                        <td>${value.support}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}