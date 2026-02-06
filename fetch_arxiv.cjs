const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

async function fetchArxiv() {
    const query = 'cat:cs.RO+OR+cat:cs.AI';
    const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=5`;

    console.log(`Fetching from ArXiv: ${url}`);
    
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);
        
        const entries = jsonObj.feed.entry;
        
        if (!entries) {
            console.log('No entries found.');
            return;
        }

        const entriesArray = Array.isArray(entries) ? entries : [entries];
        const outputDir = path.join(__dirname, 'src/content/blog');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        for (const entry of entriesArray) {
            const id = entry.id.split('/').pop();
            const title = entry.title.replace(/\n/g, ' ').trim();
            const summary = entry.summary.replace(/\n/g, ' ').trim();
            const pubDate = new Date(entry.published).toISOString().split('T')[0];
            const link = entry.id;
            const authors = Array.isArray(entry.author) 
                ? entry.author.map(a => a.name).join(', ') 
                : entry.author.name;

            const filename = `${pubDate}-arxiv-${id}.md`;
            const filePath = path.join(outputDir, filename);

            const imagePrompt = `A futuristic, high-quality, cinematic visualization of research titled: ${JSON.stringify(title)}. Scientific, clean, professional.`;

            const content = `---
title: "[ArXiv] ${title}"
description: "${summary.substring(0, 150).replace(/"/g, "'")}..."
pubDate: ${pubDate}
heroImage: "../../assets/arxiv-${id}.jpg"
imagePrompt: ${JSON.stringify(imagePrompt)}
---

**Authors:** ${authors}

**Link:** [${link}](${link})

### Abstract
${summary}

---
*Automatically fetched from ArXiv API.*
`;

            fs.writeFileSync(filePath, content);
            console.log(`Created: ${filename}`);
        }
    } catch (error) {
        console.error('Error fetching ArXiv papers:', error);
    }
}

fetchArxiv();
