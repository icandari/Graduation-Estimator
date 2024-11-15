document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('schedule-form').addEventListener('submit', function (e) {
        e.preventDefault();

        // Get the values from the form inputs
        const majorLink = document.getElementById('major-link').value;
        const minor1Link = document.getElementById('minor1-link').value;
        const minor2Link = document.getElementById('minor2-link').value;

        console.log('Submitting Links:', majorLink, minor1Link, minor2Link);

        // Construct the URL with the encoded links
        const url = `/parse-schedule?links=${encodeURIComponent(majorLink)},${encodeURIComponent(minor1Link)},${encodeURIComponent(minor2Link)}`;
        console.log('Request URL:', url); // Log the URL being requested

        // Send the fetch request to the server with the links
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse response as JSON
            })
            .then(data => {
                console.log('Fetched Data:', data);  // Log the fetched data

                // Check if the major, minor1, and minor2 fields contain valid arrays
                if (Array.isArray(data.major) && Array.isArray(data.minor1) && Array.isArray(data.minor2)) {
                    // Save the parsed data to localStorage
                    localStorage.setItem('courses', JSON.stringify(data));
                    console.log('Data saved to localStorage:', localStorage.getItem('courses')); // Confirm data is saved
                    
                    // Call the function to generate the schedule
                    generateSchedule();
                } else {
                    alert('Error: Data structure is not valid');
                }
            })
            .catch(error => {
                console.error('Error fetching course data:', error);
                alert('Failed to fetch course data.');
            });
    });

    // Function to generate the schedule from the data in localStorage
    function generateSchedule() {
        const data = JSON.parse(localStorage.getItem('courses'));
        if (!data) {
            console.log('No data found in localStorage');
            return;
        }

        console.log('Data from localStorage:', data);  // Log the data from localStorage
        const allCourses = [...data.major, ...data.minor1, ...data.minor2];
        console.log('All Courses:', allCourses);  // Log all combined courses

        const semesters = createSchedule(allCourses);
        displaySchedule(semesters);
    }

    // Function to create a schedule based on the courses
    function createSchedule(courses) {
        const semesters = { Fall: [], Winter: [], Spring: [] };
        let completedCourses = [];
        let iterations = 0;  // Add a counter to prevent infinite loops

        while (courses.length > 0 && iterations < 1000) {  // Limit iterations
            let semester = selectSemester(semesters);
            let courseToAdd = courses.find(course => {
                console.log(`Checking course: ${course.name}, offered in: ${course.offered}`);
                console.log(`Prerequisites: ${course.prerequisites}, Completed Courses: ${completedCourses}`);

                return course.offered.includes(semester) && 
                       !completedCourses.includes(course.name) && 
                       course.prerequisites.every(prerequisite => completedCourses.includes(prerequisite));
            });

            if (courseToAdd) {
                console.log(`Adding course: ${courseToAdd.name} to semester ${semester}`);
                completedCourses.push(courseToAdd.name);
                semesters[semester].push(courseToAdd);
                courses = courses.filter(course => course.name !== courseToAdd.name);
            } else {
                console.warn(`No course found for semester ${semester}.`);
            }

            iterations++; // Increment the counter
            console.log(`Iteration ${iterations}, Remaining Courses: ${courses.length}`);
        }

        return semesters;
    }

    // Function to select which semester to place the course in
    function selectSemester(semesters) {
        if (semesters.Fall.reduce((total, course) => total + course.credits, 0) < 16) {
            return 'Fall';
        }
        if (semesters.Winter.reduce((total, course) => total + course.credits, 0) < 16) {
            return 'Winter';
        }
        return 'Spring';
    }

    // Function to display the generated schedule
    function displaySchedule(semesters) {
        let output = '<h2>Your Schedule</h2>';
        
        ['Fall', 'Winter', 'Spring'].forEach(semester => {
            output += `<h3>${semester}</h3><ul>`;
            semesters[semester].forEach(course => {
                output += `<li>${course.name} - ${course.credits} credits</li>`;
            });
            output += '</ul>';
        });

        document.getElementById('schedule-output').innerHTML = output;
    }
});
