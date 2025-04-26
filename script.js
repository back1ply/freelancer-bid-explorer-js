document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const projectUrlInput = document.getElementById('projectUrl');
    const apiTokenInput = document.getElementById('apiToken');
    const outputFormatSelect = document.getElementById('outputFormat');
    const fetchButton = document.getElementById('fetchButton');
    const statusArea = document.getElementById('statusArea');
    const resultArea = document.getElementById('resultArea');
    const projectTitle = document.getElementById('projectTitle');
    const projectInfo = document.getElementById('projectInfo');
    const summaryTable = document.getElementById('summaryTable').querySelector('tbody');
    const detailedBids = document.getElementById('detailedBids');
    const downloadArea = document.getElementById('downloadArea');
    const downloadButton = document.getElementById('downloadButton');
    const spinnerArea = document.getElementById('spinnerArea');
    const spinnerText = document.getElementById('spinnerText');

    // Store bid data globally for downloads
    let allBidsData = [];
    let currentProjectTitle = '';
    let currentProjectId = '';

    // Event Listeners
    fetchButton.addEventListener('click', handleFetchBids);
    downloadButton.addEventListener('click', handleDownload);

    // Main function to fetch bids
    async function handleFetchBids() {
        const projectUrl = projectUrlInput.value.trim();
        const apiToken = apiTokenInput.value.trim();
        const outputFormat = outputFormatSelect.value;

        // Validate API token format
        if (!apiToken.match(/^[a-zA-Z0-9]{32}$/)) {
            showStatus('Invalid API token format. Please check your token.', 'error');
            return;
        }

        // Set button to loading state
        fetchButton.disabled = true;
        fetchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

        // Validate inputs
        if (!projectUrl || !apiToken) {
            showStatus('Please provide both project URL and API token.', 'error');
            return;
        }

        resetUI();
        showSpinner('Extracting project information...');

        try {
            // Extract SEO URL from project URL
            const seoUrl = extractSeoUrl(projectUrl);
            if (!seoUrl) {
                throw new Error('Invalid project URL format. Please provide a valid Freelancer.com project URL.');
            }

            // Get project details
            showSpinner('Fetching project details...');
            const projectData = await getProjectDetails(seoUrl, apiToken);
            
            if (!projectData || !projectData.result || !projectData.result.projects || projectData.result.projects.length === 0) {
                throw new Error('Could not retrieve project details. Please check your API token and try again.');
            }

            // Extract project info
            const project = projectData.result.projects[0];
            const projectId = project.id;
            currentProjectId = projectId;
            currentProjectTitle = project.title;

            // Get all bids for the project
            showSpinner('Fetching all bids...');
            const bidsData = await getAllBids(projectId, apiToken);
            
            if (!bidsData || !bidsData.result || !bidsData.result.bids || bidsData.result.bids.length === 0) {
                throw new Error('No bids found for this project.');
            }

            // Process bids
            const bidList = processBidsWithDescriptions(bidsData.result.bids);
            allBidsData = bidList;

            if (outputFormat === 'view') {
                // Display results in the UI
                displayResults(project.title, projectId, bidList);
            } else {
                // Show download button
                hideSpinner();
                showStatus(`Found ${bidList.length} bids for project: ${project.title}`, 'success');
                downloadArea.classList.remove('d-none');
            }

        } catch (error) {
            hideSpinner();
            const errorMessage = error.status === 401 ? 'Invalid API token. Please check your credentials.' : error.message;
            showStatus(errorMessage, 'error');
        } finally {
            // Reset button state
            fetchButton.disabled = false;
            fetchButton.innerHTML = 'Get Bids';
        }
    }

    // Extract SEO URL from a Freelancer project URL
    function extractSeoUrl(url) {
        const pattern = /\/projects\/([^/]+)\/([^/]+)/;
        const match = url.match(pattern);
        
        if (match) {
            const category = match[1];
            // Remove any trailing details like /proposals or /details
            const slug = match[2].split('/')[0];
            return `${category}/${slug}`;
        }
        
        return null;
    }

    // Get project details using the SEO URL
    async function getProjectDetails(seoUrl, authToken) {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${authToken}`
        };
        
        const encodedSeoUrl = encodeURIComponent(seoUrl);
        const url = `https://www.freelancer.com/api/projects/0.1/projects?limit=1&seo_urls%5B%5D=${encodedSeoUrl}&selected_bids=true&compact=true`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching project details: ${response.status}`);
        }
        
        return await response.json();
    }

    // Get all bids for a project with full details
    async function getAllBids(projectId, authToken) {
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const url = `https://www.freelancer.com/api/projects/0.1/projects/${projectId}/bids/?limit=100&full_description=true`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching bids: ${response.status}`);
        }
        
        return await response.json();
    }

    // Process bid data focusing on complete descriptions
    function processBidsWithDescriptions(bidsData) {
        const bidList = [];
        
        for (const bid of bidsData) {
            const bidInfo = {
                'bidId': bid.id || 'N/A',
                'freelancerId': bid.bidder_id || 'N/A',
                'username': bid.username || 'N/A',
                'amount': `$${bid.amount || 0}`,
                'deliveryTime': `${bid.period || 'N/A'} days`,
                'rating': 'N/A',
                'description': bid.description || 'No description provided'
            };
            
            // Add rating if available
            try {
                if (bid.reputation && bid.reputation.entire) {
                    bidInfo.rating = `${parseFloat(bid.reputation.entire).toFixed(1)}/5.0`;
                }
            } catch (e) {
                // Keep default 'N/A' if there's an issue
            }
            
            bidList.push(bidInfo);
        }
        
        return bidList;
    }

    // Display results in the UI
    function displayResults(projectTitle, projectId, bidList) {
        hideSpinner();
        
        // Set project information
        document.getElementById('projectTitle').textContent = `Bids for: ${projectTitle}`;
        document.getElementById('projectInfo').textContent = `Project ID: ${projectId} | Total bids: ${bidList.length}`;
        
        // Clear previous results
        summaryTable.innerHTML = '';
        detailedBids.innerHTML = '';
        
        // Add bids to the summary table
        bidList.forEach((bid, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bid.username}</td>
                <td>${bid.amount}</td>
                <td>${bid.deliveryTime}</td>
                <td>${bid.rating}</td>
                <td><button class="btn btn-sm btn-outline-primary view-details-btn" data-index="${index}">View Details</button></td>
            `;
            summaryTable.appendChild(row);
            
            // Add to detailed view accordion
            const accordion = document.createElement('div');
            accordion.className = 'accordion-item';
            accordion.innerHTML = `
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                        ${bid.username} - ${bid.amount} - ${bid.rating}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}">
                    <div class="accordion-body">
                        <p><strong>Delivery Time:</strong> ${bid.deliveryTime}</p>
                        <p><strong>Description:</strong></p>
                        <div class="bid-description">${bid.description}</div>
                    </div>
                </div>
            `;
            detailedBids.appendChild(accordion);
        });
        
        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                // Find the accordion button and click it
                document.querySelector(`#heading${index} .accordion-button`).click();
                // Scroll to that section
                document.querySelector(`#collapse${index}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
        
        // Show results area
        resultArea.classList.remove('d-none');
    }

    // Handle download of results
    function handleDownload() {
        const outputFormat = outputFormatSelect.value;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
        const fileName = `freelancer_bids_${currentProjectId}_${timestamp}`;
        
        if (outputFormat === 'csv') {
            downloadCsv(fileName);
        } else if (outputFormat === 'txt') {
            downloadTxt(fileName);
        }
    }

    // Download as CSV file
    function downloadCsv(fileName) {
        // Create CSV content
        const headers = ['Bid ID', 'Freelancer ID', 'Username', 'Amount', 'Delivery Time', 'Rating', 'Description'];
        let csvContent = headers.join(',') + '\n';
        
        allBidsData.forEach(bid => {
            // Escape description to handle commas and newlines in CSV
            const escapedDescription = `"${bid.description.replace(/"/g, '""')}"`;
            const row = [
                bid.bidId,
                bid.freelancerId,
                bid.username,
                bid.amount,
                bid.deliveryTime,
                bid.rating,
                escapedDescription
            ];
            csvContent += row.join(',') + '\n';
        });
        
        // Create and trigger download
        downloadFile(`${fileName}.csv`, csvContent, 'text/csv');
    }

    // Download as TXT file
    function downloadTxt(fileName) {
        let txtContent = `Bids for project: ${currentProjectTitle}\n`;
        txtContent += `Project ID: ${currentProjectId}\n`;
        txtContent += `Total bids: ${allBidsData.length}\n\n`;
        
        allBidsData.forEach(bid => {
            txtContent += `Bid ID: ${bid.bidId}\n`;
            txtContent += `Username: ${bid.username}\n`;
            txtContent += `Amount: ${bid.amount}\n`;
            txtContent += `Delivery Time: ${bid.deliveryTime}\n`;
            txtContent += `Rating: ${bid.rating}\n`;
            txtContent += `Description:\n${bid.description}\n`;
            txtContent += '\n' + '-'.repeat(80) + '\n\n';
        });
        
        // Create and trigger download
        downloadFile(`${fileName}.txt`, txtContent, 'text/plain');
    }

    // Helper function to trigger file download
    function downloadFile(fileName, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Helper function to show status message
    function showStatus(message, type) {
        statusArea.textContent = message;
        statusArea.classList.remove('d-none', 'alert-success', 'alert-danger');
        
        if (type === 'error') {
            statusArea.classList.add('alert-danger');
        } else if (type === 'success') {
            statusArea.classList.add('alert-success');
        } else {
            statusArea.classList.add('alert-info');
        }
    }

    // Helper function to show spinner
    function showSpinner(message) {
        spinnerText.textContent = message || 'Loading...';
        spinnerArea.classList.remove('d-none');
    }

    // Helper function to hide spinner
    function hideSpinner() {
        spinnerArea.classList.add('d-none');
    }

    // Helper function to reset UI
    function resetUI() {
        statusArea.classList.add('d-none');
        resultArea.classList.add('d-none');
        downloadArea.classList.add('d-none');
        summaryTable.innerHTML = '';
        detailedBids.innerHTML = '';
    }
});
