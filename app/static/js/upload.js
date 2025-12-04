// SecureAgentbox - Upload JavaScript

// Global variables
let currentFileHash = null;
let currentFileExtension = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const fileAnalysisArea = document.getElementById('fileAnalysisArea');
    
    let dragCounter = 0;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    dropZone.addEventListener('dragenter', () => {
        dragCounter++;
        if (dragCounter === 1) {
            dropZone.querySelector('label').style.borderColor = 'var(--primary)';
            dropZone.querySelector('label').style.background = 'var(--bg-hover)';
        }
    });

    dropZone.addEventListener('dragleave', () => {
        dragCounter--;
        if (dragCounter === 0) {
            dropZone.querySelector('label').style.borderColor = '';
            dropZone.querySelector('label').style.background = '';
        }
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        dragCounter = 0;
        dropZone.querySelector('label').style.borderColor = '';
        dropZone.querySelector('label').style.background = '';
        
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleFile(file) {
        console.log('File selected:', file.name);
        
        // Show loading state
        showNotification('Uploading file...', 'info');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload file
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            
            console.log('Upload successful:', data);
            showNotification('File uploaded successfully!', 'success');
            
            // Store file info
            currentFileHash = data.file_info.md5;
            currentFileExtension = data.file_info.extension;
            
            // Update progress
            updateProgress();
            
            // Display file info
            displayFileInfo(data.file_info);
            
            // Show analysis area
            uploadArea.style.display = 'none';
            fileAnalysisArea.classList.remove('hidden');
            setTimeout(() => {
                fileAnalysisArea.style.opacity = '1';
                fileAnalysisArea.style.transform = 'scale(1)';
            }, 50);
        })
        .catch(error => {
            console.error('Upload error:', error);
            showNotification('Upload failed: ' + error.message, 'error');
        });
    }

    function updateProgress() {
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        
        if (step1) {
            step1.classList.add('completed');
            step1.querySelector('.step-number').style.display = 'none';
            step1.querySelector('.step-check').classList.remove('hidden');
        }
        
        if (step2) {
            step2.classList.add('active');
        }
    }

    function displayFileInfo(fileInfo) {
        // Update file name
        const fileName = document.getElementById('fileName');
        if (fileName) fileName.textContent = fileInfo.original_name;
        
        // Update file size
        const fileSize = document.getElementById('fileSize');
        if (fileSize) fileSize.textContent = formatFileSize(fileInfo.size);
        
        // Update file type
        const fileType = document.getElementById('fileType');
        if (fileType) fileType.textContent = fileInfo.extension.toUpperCase();
        
        // Update hashes
        const md5Hash = document.getElementById('md5Hash');
        if (md5Hash) md5Hash.textContent = fileInfo.md5;
        
        const sha256Hash = document.getElementById('sha256Hash');
        if (sha256Hash) sha256Hash.textContent = fileInfo.sha256;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});

// Analysis type selection
function selectAnalysisType(type) {
    console.log('Analysis type selected:', type);
    
    // Show args input only for dynamic analysis
    const argsContainer = document.getElementById('argsInputContainer');
    if (argsContainer) {
        if (type === 'dynamic') {
            argsContainer.classList.remove('hidden');
        } else {
            argsContainer.classList.add('hidden');
        }
    }
    
    // Get command line arguments if dynamic analysis
    let args = [];
    if (type === 'dynamic') {
        const argsInput = document.getElementById('analysisArgs');
        if (argsInput && argsInput.value.trim()) {
            args = argsInput.value.trim().split(/\s+/);
        }
    }
    
    // Start analysis
    startAnalysis(type, args);
}

function startAnalysis(type, args = []) {
    if (!currentFileHash) {
        showNotification('No file uploaded', 'error');
        return;
    }
    
    // Show analyzing modal
    showAnalyzingModal(type);
    
    const requestBody = args.length > 0 ? { args: args } : {};
    
    fetch(`/analyze/${type}/${currentFileHash}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        hideAnalyzingModal();
        
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        
        if (data.status === 'success') {
            showNotification('Analysis completed successfully!', 'success');
            
            // Redirect to results page
            setTimeout(() => {
                window.location.href = `/results/${currentFileHash}/${type}`;
            }, 1000);
        } else if (data.status === 'early_termination') {
            showNotification('Process terminated early: ' + data.error, 'error');
        } else {
            showNotification('Analysis failed', 'error');
        }
    })
    .catch(error => {
        hideAnalyzingModal();
        console.error('Analysis error:', error);
        showNotification('Analysis failed: ' + error.message, 'error');
    });
}

function showAnalyzingModal(type) {
    const modal = document.createElement('div');
    modal.id = 'analyzingModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 400px;">
            <div class="modal-body" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto 1.5rem;"></div>
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Analyzing File</h3>
                <p style="color: var(--text-secondary);">Running ${type} analysis, please wait...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function hideAnalyzingModal() {
    const modal = document.getElementById('analyzingModal');
    if (modal) {
        modal.remove();
    }
}

// Copy hash to clipboard
function copyHash(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Hash copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy hash', 'error');
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Use the global notification system from base.js
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback to console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
