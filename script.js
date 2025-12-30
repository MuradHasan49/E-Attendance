 /* ================= DATA MANAGEMENT ================= */
        const STORAGE_KEYS = {
            STUDENTS: 'attendance_students',
            ATTENDANCE: 'attendance_records',
            FINGERPRINTS: 'attendance_fingerprints',
            SETTINGS: 'attendance_settings'
        };

        // Initialize data
        let students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
        let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
        let fingerprints = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINGERPRINTS)) || [];
        let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { lastFingerId: 1 };

        let currentCourse = "", currentSemester = "", currentMonth = "";
        const currentYear = new Date().getFullYear();

        /* ================= UTILITY FUNCTIONS ================= */
        function showNotification(message, type = 'success') {
            const notif = document.getElementById('notification');
            notif.textContent = message;
            notif.className = `notification ${type}`;
            notif.classList.remove('hidden');

            setTimeout(() => {
                notif.classList.add('hidden');
            }, 3000);
        }

        function saveToLocalStorage() {
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
            localStorage.setItem(STORAGE_KEYS.FINGERPRINTS, JSON.stringify(fingerprints));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }

        function formatDate(date = new Date()) {
            return date.toISOString().split('T')[0];
        }

        function formatTime(date = new Date()) {
            return date.toTimeString().split(' ')[0];
        }

        /* ================= SIMPLIFIED NAVIGATION ================= */
        function openSemester(course) {
            currentCourse = course;
            document.getElementById("courses").classList.add("hidden");
            document.getElementById("semesters").classList.remove("hidden");
            document.getElementById("courseTitle").innerText = course;
        }

        function openMonths(semester) {
            currentSemester = semester;
            document.getElementById("semesters").classList.add("hidden");
            document.getElementById("months").classList.remove("hidden");
            document.getElementById("semesterTitle").innerText = `${currentCourse} | ${semester}`;
        }

        function openAttendance(month) {
            currentMonth = month;
            document.getElementById("months").classList.add("hidden");
            document.getElementById("attendance").classList.remove("hidden");
            document.getElementById("attLine").innerText = `${currentCourse} | ${currentSemester}`;
            document.getElementById("attMonth").innerText = `${month} ${currentYear}`;

            loadAttendanceData();
        }

        function goBack(from, to) {
            document.getElementById(from).classList.add("hidden");
            document.getElementById(to).classList.remove("hidden");
        }

        function goHome() {
            document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
            document.getElementById("courses").classList.remove("hidden");
        }

        function openAbout() {
            goHome();
            document.getElementById("courses").classList.add("hidden");
            document.getElementById("aboutPage").classList.remove("hidden");
        }

        function openService() {
            goHome();
            document.getElementById("courses").classList.add("hidden");
            document.getElementById("servicePage").classList.remove("hidden");
        }

        function openDashboard() {
            goHome();
            document.getElementById("courses").classList.add("hidden");
            document.getElementById("dashboard").classList.remove("hidden");
            updateDashboard();
        }

        /* ================= CONTACT ================= */
        function openContact() {
            document.getElementById("contactPopup").style.display = "flex";
        }

        function closeContact() {
            document.getElementById("contactPopup").style.display = "none";
        }

        /* ================= STUDENT MANAGEMENT ================= */
        function addStudent() {
            const roll = document.getElementById("roll").value.trim();
            const name = document.getElementById("name").value.trim();
            const dept = document.getElementById("department").value;

            if (!roll || !name || !dept) {
                showNotification("Please fill all fields", "error");
                return;
            }

            if (students.find(s => s.roll === roll)) {
                showNotification("Student with this roll already exists", "error");
                return;
            }

            const student = {
                id: Date.now(),
                roll,
                name,
                dept,
                fingerId: null,
                createdAt: new Date().toISOString()
            };

            students.push(student);
            saveToLocalStorage();
            renderStudents();

            document.getElementById("roll").value = "";
            document.getElementById("name").value = "";
            document.getElementById("department").value = "";

            showNotification("Student added successfully");
        }

        function renderStudents() {
            const table = document.getElementById("studentTable");
            const enrollSelect = document.getElementById("enrollStudent");
            const quickSelect = document.getElementById("quickRoll");

            table.innerHTML = "";
            enrollSelect.innerHTML = '<option value="">Select Student</option>';
            quickSelect.innerHTML = '<option value="">Select Student</option>';

            students.forEach((student, index) => {
                // Calculate attendance percentage
                const studentAtt = attendance.filter(a => a.roll === student.roll);
                const presentCount = studentAtt.filter(a => a.status === 'present').length;
                const percentage = studentAtt.length > 0 ? Math.round((presentCount / studentAtt.length) * 100) : 0;

                // Add to table
                table.innerHTML += `
      <tr>
        <td>${student.roll}</td>
        <td>${student.name}</td>
        <td>${student.dept}</td>
        <td>${student.fingerId || 'Not Enrolled'}</td>
        <td>${percentage}%</td>
        <td>
          <button class="btn btn-primary" onclick="editStudent(${index})">Edit</button>
          <button class="btn btn-danger" onclick="removeStudent(${index})">Delete</button>
          ${!student.fingerId ? `<button class="btn btn-success" onclick="openEnroll(${index})">Enroll</button>` : ''}
        </td>
      </tr>`;

                // Add to dropdowns
                enrollSelect.innerHTML += `<option value="${index}">${student.roll} - ${student.name}</option>`;
                quickSelect.innerHTML += `<option value="${student.roll}">${student.roll} - ${student.name}</option>`;
            });
        }

        function editStudent(index) {
            const student = students[index];
            const newName = prompt("Enter new name:", student.name);
            const newDept = prompt("Enter new department:", student.dept);

            if (newName && newDept) {
                students[index].name = newName;
                students[index].dept = newDept;
                saveToLocalStorage();
                renderStudents();
                showNotification("Student updated successfully");
            }
        }

        function removeStudent(index) {
            if (confirm("Are you sure you want to delete this student?")) {
                const student = students[index];

                // Remove student's attendance records
                attendance = attendance.filter(a => a.roll !== student.roll);

                // Remove fingerprint
                if (student.fingerId) {
                    fingerprints = fingerprints.filter(f => f !== student.fingerId);
                }

                // Remove student
                students.splice(index, 1);

                saveToLocalStorage();
                renderStudents();
                loadAttendanceData();
                showNotification("Student deleted successfully");
            }
        }

        function importStudents() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';

            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = function (event) {
                    const csv = event.target.result;
                    const lines = csv.split('\n');

                    let imported = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const [roll, name, dept] = lines[i].split(',');
                        if (roll && name && dept) {
                            if (!students.find(s => s.roll === roll.trim())) {
                                students.push({
                                    id: Date.now() + i,
                                    roll: roll.trim(),
                                    name: name.trim(),
                                    dept: dept.trim(),
                                    fingerId: null,
                                    createdAt: new Date().toISOString()
                                });
                                imported++;
                            }
                        }
                    }

                    saveToLocalStorage();
                    renderStudents();
                    showNotification(`Imported ${imported} students successfully`);
                };

                reader.readAsText(file);
            };

            input.click();
        }

        /* ================= FINGERPRINT ENROLLMENT ================= */
        function openEnroll(index = null) {
            const modal = document.getElementById("enrollModal");
            const select = document.getElementById("enrollStudent");

            if (index !== null) {
                select.value = index;
            }

            modal.style.display = "flex";
        }

        function closeEnroll() {
            document.getElementById("enrollModal").style.display = "none";
        }

        function startEnroll() {
            const index = document.getElementById("enrollStudent").value;

            if (index === "") {
                showNotification("Please select a student", "error");
                return;
            }

            const finger = document.getElementById("enrollFinger");
            finger.classList.add("scanning");
            finger.innerHTML = "<div>Scanning...</div>";

            setTimeout(() => {
                const fingerId = `FID-${settings.lastFingerId++}`;
                students[index].fingerId = fingerId;
                fingerprints.push(fingerId);

                saveToLocalStorage();
                renderStudents();

                finger.classList.remove("scanning");
                finger.innerHTML = `<div>Enrolled!<br>ID: ${fingerId}</div>`;

                showNotification("Fingerprint enrolled successfully");

                setTimeout(closeEnroll, 2000);
            }, 2000);
        }

        /* ================= ATTENDANCE MANAGEMENT ================= */
        function openScan() {
            document.getElementById("scanModal").style.display = "flex";
            startScan();
        }

        function closeScan() {
            document.getElementById("scanModal").style.display = "none";
        }

        function startScan() {
            const finger = document.getElementById("scanFinger");
            finger.classList.add("scanning");

            setTimeout(() => {
                // Find student with fingerprint
                const enrolledStudents = students.filter(s => s.fingerId);
                if (enrolledStudents.length === 0) {
                    showNotification("No students enrolled", "error");
                    closeScan();
                    return;
                }

                const randomStudent = enrolledStudents[Math.floor(Math.random() * enrolledStudents.length)];
                markAttendanceForStudent(randomStudent.roll, 'present');

                finger.classList.remove("scanning");
                showNotification(`Attendance marked for ${randomStudent.name}`);

                setTimeout(closeScan, 1000);
            }, 1500);
        }

        function markAttendance() {
            const roll = document.getElementById("quickRoll").value;
            const status = document.getElementById("quickStatus").value;
            const time = document.getElementById("quickTime").value || formatTime();

            if (!roll) {
                showNotification("Please select a student", "error");
                return;
            }

            markAttendanceForStudent(roll, status, time);
        }

        function markAttendanceForStudent(roll, status, customTime = null) {
            const student = students.find(s => s.roll === roll);
            if (!student) {
                showNotification("Student not found", "error");
                return;
            }

            const now = new Date();
            const attendanceRecord = {
                id: Date.now(),
                roll: student.roll,
                name: student.name,
                dept: student.dept,
                date: formatDate(now),
                time: customTime || formatTime(now),
                status: status,
                course: currentCourse,
                semester: currentSemester,
                month: currentMonth,
                year: currentYear,
                timestamp: now.toISOString()
            };

            attendance.push(attendanceRecord);
            saveToLocalStorage();
            loadAttendanceData();

            showNotification(`Marked ${status} for ${student.name}`);
        }

        function markAllPresent() {
            if (!confirm("Mark all students as present for today?")) return;

            const today = formatDate();
            students.forEach(student => {
                // Check if already marked today
                const alreadyMarked = attendance.some(a =>
                    a.roll === student.roll && a.date === today
                );

                if (!alreadyMarked) {
                    markAttendanceForStudent(student.roll, 'present');
                }
            });
        }

        function editAttendanceRecord(index) {
            const record = attendance[index];
            document.getElementById("editRoll").value = record.roll;
            document.getElementById("editName").value = record.name;
            document.getElementById("editDate").value = record.date;
            document.getElementById("editTime").value = record.time;
            document.getElementById("editStatus").value = record.status;

            window.editingIndex = index;
            document.getElementById("editModal").style.display = "flex";
        }

        function saveEdit() {
            const index = window.editingIndex;
            if (index === undefined) return;

            attendance[index].date = document.getElementById("editDate").value;
            attendance[index].time = document.getElementById("editTime").value;
            attendance[index].status = document.getElementById("editStatus").value;

            saveToLocalStorage();
            loadAttendanceData();
            closeEdit();
            showNotification("Attendance updated successfully");
        }

        function closeEdit() {
            document.getElementById("editModal").style.display = "none";
            delete window.editingIndex;
        }

        function deleteAttendanceRecord(index) {
            if (confirm("Delete this attendance record?")) {
                attendance.splice(index, 1);
                saveToLocalStorage();
                loadAttendanceData();
                showNotification("Record deleted");
            }
        }

        function filterAttendance() {
            const dateFilter = document.getElementById("filterDate").value;
            const statusFilter = document.getElementById("filterStatus").value;
            const deptFilter = document.getElementById("filterDept").value;

            let filtered = attendance;

            if (dateFilter) {
                filtered = filtered.filter(a => a.date === dateFilter);
            }

            if (statusFilter) {
                filtered = filtered.filter(a => a.status === statusFilter);
            }

            if (deptFilter) {
                filtered = filtered.filter(a => a.dept === deptFilter);
            }

            renderAttendanceTable(filtered);
        }

        function clearFilters() {
            document.getElementById("filterDate").value = "";
            document.getElementById("filterStatus").value = "";
            document.getElementById("filterDept").value = "";
            loadAttendanceData();
        }

        function quickFill() {
            const roll = document.getElementById("quickRoll").value;
            if (roll) {
                const student = students.find(s => s.roll === roll);
                if (student) {
                    document.getElementById("quickStatus").value = 'present';
                    document.getElementById("quickTime").value = formatTime();
                }
            }
        }

        function loadAttendanceData() {
            // Calculate statistics
            const today = formatDate();
            const todayRecords = attendance.filter(a => a.date === today);
            const monthRecords = attendance.filter(a => a.month === currentMonth);

            const totalStudents = students.length;
            const todayPresent = todayRecords.filter(a => a.status === 'present').length;
            const todayPercentage = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

            const monthPresent = monthRecords.filter(a => a.status === 'present').length;
            const monthTotal = monthRecords.length;
            const monthPercentage = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

            // Update stats
            document.getElementById("statsContainer").innerHTML = `
    <div class="stat-card">
      <h3>Total Students</h3>
      <p class="stat-total">${totalStudents}</p>
    </div>
    <div class="stat-card">
      <h3>Today's Attendance</h3>
      <p class="${todayPercentage >= 75 ? 'stat-present' : 'stat-absent'}">${todayPercentage}%</p>
    </div>
    <div class="stat-card">
      <h3>This Month</h3>
      <p class="${monthPercentage >= 75 ? 'stat-present' : 'stat-absent'}">${monthPercentage}%</p>
    </div>
    <div class="stat-card">
      <h3>Enrolled Fingers</h3>
      <p class="stat-total">${fingerprints.length}</p>
    </div>
  `;

            // Render attendance table
            renderAttendanceTable(attendance);

            // Update student table
            renderStudents();
        }

        function renderAttendanceTable(records) {
            const table = document.getElementById("attendanceTable");
            table.innerHTML = "";

            records.forEach((record, index) => {
                table.innerHTML += `
      <tr class="status-${record.status}">
        <td>${record.date}</td>
        <td>${record.time}</td>
        <td>${record.roll}</td>
        <td>${record.name}</td>
        <td>${record.dept}</td>
        <td><span class="status-${record.status}">${record.status.toUpperCase()}</span></td>
        <td>
          <button class="btn btn-primary" onclick="editAttendanceRecord(${index})">Edit</button>
          <button class="btn btn-danger" onclick="deleteAttendanceRecord(${index})">Delete</button>
        </td>
      </tr>`;
            });
        }

        /* ================= EXPORT ================= */
        function exportCSV() {
            let csv = "Date,Time,Roll,Name,Department,Status,Course,Semester,Month,Year\n";

            attendance.forEach(record => {
                csv += `${record.date},${record.time},${record.roll},${record.name},${record.dept},${record.status},${record.course},${record.semester},${record.month},${record.year}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${formatDate()}.csv`;
            a.click();

            showNotification("CSV exported successfully");
        }

        function resetAll() {
            if (confirm("This will delete ALL data. Are you sure?")) {
                localStorage.clear();
                students = [];
                attendance = [];
                fingerprints = [];
                settings = { lastFingerId: 1 };

                renderStudents();
                loadAttendanceData();
                showNotification("All data has been reset");
            }
        }

        /* ================= DASHBOARD ================= */
        function updateDashboard() {
            const today = formatDate();
            const thisMonth = new Date().toLocaleString('default', { month: 'long' });

            // Calculate statistics
            const totalStudents = students.length;
            const todayRecords = attendance.filter(a => a.date === today);
            const monthRecords = attendance.filter(a => a.month === thisMonth);

            const todayPresent = todayRecords.filter(a => a.status === 'present').length;
            const todayPercentage = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

            const monthPresent = monthRecords.filter(a => a.status === 'present').length;
            const monthTotal = monthRecords.length;
            const monthPercentage = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

            // Update stats
            document.getElementById("totalStudents").textContent = totalStudents;
            document.getElementById("todayAttendance").textContent = todayPercentage + '%';
            document.getElementById("monthlyAverage").textContent = monthPercentage + '%';
            document.getElementById("enrolledFingers").textContent = fingerprints.length;

            // Update recent attendance
            const recentDates = [...new Set(attendance.map(a => a.date))].sort().reverse().slice(0, 10);
            const dashboardTable = document.getElementById("dashboardTable");
            dashboardTable.innerHTML = "";

            recentDates.forEach(date => {
                const dayRecords = attendance.filter(a => a.date === date);
                const present = dayRecords.filter(a => a.status === 'present').length;
                const absent = dayRecords.filter(a => a.status === 'absent').length;
                const late = dayRecords.filter(a => a.status === 'late').length;
                const total = present + absent + late;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                dashboardTable.innerHTML += `
      <tr>
        <td>${date}</td>
        <td>${total}</td>
        <td>${present}</td>
        <td>${absent}</td>
        <td>${late}</td>
        <td>${percentage}%</td>
      </tr>`;
            });

            // Update department stats
            const deptStats = document.getElementById("deptStats");
            deptStats.innerHTML = "";

            const departments = [...new Set(students.map(s => s.dept))];
            departments.forEach(dept => {
                const deptStudents = students.filter(s => s.dept === dept);
                const deptToday = attendance.filter(a => a.dept === dept && a.date === today);
                const deptPresent = deptToday.filter(a => a.status === 'present').length;
                const deptPercentage = deptStudents.length > 0 ? Math.round((deptPresent / deptStudents.length) * 100) : 0;

                deptStats.innerHTML += `
      <tr>
        <td>${dept}</td>
        <td>${deptStudents.length}</td>
        <td>${deptPercentage}%</td>
        <td>${deptPresent}/${deptStudents.length}</td>
      </tr>`;
            });
        }

        /* ================= INITIALIZATION ================= */
        document.addEventListener('DOMContentLoaded', function () {
            // Set default time
            document.getElementById("quickTime").value = formatTime();
            document.getElementById("filterDate").value = formatDate();

            // Load initial data
            renderStudents();
            loadAttendanceData();

            // Auto-save every minute
            setInterval(saveToLocalStorage, 60000);
        });