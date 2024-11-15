const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

async function fetchAndParseCourseData(url) {
    try {
        const response = await axios.get(url, { timeout: 10000 });  // Add a timeout of 10 seconds
        const $ = cheerio.load(response.data);
        const courses = [];

        console.log(`Fetching data from: ${url}`);

        // Loop through each row of the course table
        $('table.very-tight tbody tr').each((i, element) => {
            const courseName = $(element).find('.Link').text().trim();  // Course name inside <a class="Link">
            const semestersOffered = $(element).find('td').eq(2).text().trim(); // Semesters are in the third <td>
            const credits = $(element).find('td').eq(3).text().trim();  // Credits are in the fourth <td>
            const prerequisites = $(element).find('td').eq(4).text().trim();  // Prerequisites are in the fifth <td>

            // Only push to courses array if we have valid data
            if (courseName && semestersOffered && credits) {
                console.log(`Found course: ${courseName}, ${credits} credits, offered in ${semestersOffered}`);
                courses.push({
                    name: courseName,
                    credits: parseFloat(credits),
                    prerequisites: prerequisites ? prerequisites.split(',') : [],
                    offered: semestersOffered.split(',')
                });
            }
        });

        console.log('Parsed courses:', courses);
        return courses;
    } catch (error) {
        console.error('Error scraping course data:', error);
        return [];
    }
}

app.get('/parse-schedule', async (req, res) => {
    const links = req.query.links; // Expecting a comma-separated string of URLs

    console.log('Received Links:', links);

    if (!links || links.split(',').length !== 3) {
        console.error('Bad Request: Missing or incorrect number of URLs');
        return res.status(400).json({ message: 'Please provide exactly 3 URLs (1 major and 2 minors).' });
    }

    const [majorLink, minor1Link, minor2Link] = links.split(',');

    try {
        console.log('Fetching course data...');
        
        // Fetch and parse the course data for all three links concurrently
        const [majorData, minor1Data, minor2Data] = await Promise.all([
            fetchAndParseCourseData(majorLink),
            fetchAndParseCourseData(minor1Link),
            fetchAndParseCourseData(minor2Link)
        ]);

        // Log the data to verify
        console.log('Data fetched successfully:', { majorData, minor1Data, minor2Data });

        // Prepare the response with parsed data
        const result = {
            major: majorData,
            minor1: minor1Data,
            minor2: minor2Data
        };

        // Send the response back to the client (JSON)
        console.log('Sending response to client');
        res.json(result);  // Make sure the response is sent back properly

    } catch (error) {
        console.error('Error parsing data:', error);
        res.status(500).json({ message: 'Error parsing the data.' });
    }
});

// Serve index.html when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
