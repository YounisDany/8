document.addEventListener('DOMContentLoaded', function() {
    const correctPin = "1234"; // رمز الدخول الصحيح
    const pinContainer = document.getElementById('pin-container');
    const mainContainer = document.getElementById('main-container');
    const pinInput = document.getElementById('pin-input');
    const pinButton = document.getElementById('pin-button');
    const sessionRecords = document.getElementById('session-records');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');

    pinButton.addEventListener('click', function() {
        if (pinInput.value === correctPin) {
            pinContainer.style.display = 'none';
            mainContainer.style.display = 'block';
            loadSessionsFromLocalStorage();
        } else {
            alert('الرمز غير صحيح. حاول مرة أخرى.');
        }
    });

    document.getElementById('bookingForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const customerName = document.getElementById('customerName').value;
        const sessionNumber = document.getElementById('sessionNumber').value;
        const rentalTime = parseInt(document.getElementById('rentalTime').value, 10);
        const startTime = new Date();
        let endTime = new Date(startTime.getTime() + rentalTime * 60000);
        const sessionName = `جلسة ${sessionNumber}`;
        const existingSession = document.getElementById(`session-${sessionNumber}`);
        
        if (existingSession) {
            alert(`جلسة ${sessionNumber} مشغولة بالفعل.`);
            return;
        }

        const sessionElement = document.createElement('div');
        sessionElement.className = 'session';
        sessionElement.id = `session-${sessionNumber}`;
        sessionElement.innerHTML = `<h2>${sessionName}</h2><div id="countdown-${sessionNumber}"></div>
                                    <div>اسم الزبون: ${customerName}</div>
                                    <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                    <button onclick="extendSession(${sessionNumber})">تعديل الوقت</button>
                                    <button onclick="cancelSession(${sessionNumber})">إلغاء الجلسة</button>`;
        document.getElementById('notifications').appendChild(sessionElement);

        saveSessionToLocalStorage(sessionNumber, {
            customerName: customerName,
            startTime: startTime,
            endTime: endTime
        });

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = endTime - now;
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById(`countdown-${sessionNumber}`).innerHTML = `الوقت المتبقي: ${minutes} دقيقة و ${seconds} ثانية`;

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById(`countdown-${sessionNumber}`).innerHTML = "انتهى الوقت!";
                const audio = new Audio('buzzer.mp3');
                            audio.play();
            if ('speechSynthesis' in window) {
                const message = `جلسة ${sessionNumber} انتهى وقتهم`;
                const utterance = new SpeechSynthesisUtterance(message);
                speechSynthesis.speak(utterance);
            } else {
                alert("خاصية النطق غير مدعومة في هذا المتصفح.");
            }
            setTimeout(() => {
                document.getElementById('notifications').removeChild(sessionElement);
                const recordElement = document.createElement('div');
                recordElement.className = 'session';
                recordElement.innerHTML = `<h2>${sessionName}</h2>
                                           <div>الزبون: ${customerName}</div>
                                           <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                           <div>وقت الانتهاء: ${endTime.toLocaleTimeString()}</div>`;
                sessionRecords.appendChild(recordElement);
                removeSessionFromLocalStorage(sessionNumber);
            }, 60000); // إزالة العنصر بعد دقيقة واحدة
        }
    }

    updateCountdown(); // الاستدعاء الأولي لإظهار العد التنازلي فوراً
    const countdownInterval = setInterval(updateCountdown, 1000);

    // إضافة وظائف تعديل الوقت وإلغاء الجلسة
    window.extendSession = function(sessionNumber) {
        const additionalTime = prompt("أدخل الوقت الإضافي بالدقائق:");
        if (additionalTime) {
            const additionalTimeMs = parseInt(additionalTime, 10) * 60000;
            endTime = new Date(endTime.getTime() + additionalTimeMs);
            saveSessionToLocalStorage(sessionNumber, {
                customerName: customerName,
                startTime: startTime,
                endTime: endTime
            });
            alert(`تم إضافة ${additionalTime} دقيقة إلى الجلسة ${sessionNumber}.`);
        }
    };

    window.cancelSession = function(sessionNumber) {
        const confirmCancel = confirm("هل أنت متأكد من إلغاء الجلسة؟");
        if (confirmCancel) {
            clearInterval(countdownInterval);
            document.getElementById('notifications').removeChild(document.getElementById(`session-${sessionNumber}`));
            removeSessionFromLocalStorage(sessionNumber);
            alert(`تم إلغاء الجلسة ${sessionNumber}.`);
        }
    };
});

saveButton.addEventListener('click', function() {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    saveAs(blob, 'sessions.json');
});

loadButton.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const sessions = JSON.parse(e.target.result);
            for (const sessionNumber in sessions) {
                const sessionData = sessions[sessionNumber];
                saveSessionToLocalStorage(sessionNumber, sessionData);
            }
            loadSessionsFromLocalStorage();
        };
        reader.readAsText(file);
    };
    input.click();
});

function saveSessionToLocalStorage(sessionNumber, sessionData) {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
    sessions[sessionNumber] = sessionData;
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

function removeSessionFromLocalStorage(sessionNumber) {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
    delete sessions[sessionNumber];
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

function loadSessionsFromLocalStorage() {
    const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
    for (const sessionNumber in sessions) {
        const sessionData = sessions[sessionNumber];
        const startTime = new Date(sessionData.startTime);
        const endTime = new Date(sessionData.endTime);
        const customerName = sessionData.customerName;
        const sessionName = `جلسة ${sessionNumber}`;
        const sessionElement = document.createElement('div');
        sessionElement.className = 'session';
        sessionElement.id = `session-${sessionNumber}`;
        sessionElement.innerHTML = `<h2>${sessionName}</h2><div id="countdown-${sessionNumber}"></div>
                                    <div>اسم الزبون: ${customerName}</div>
                                    <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                    <button onclick="extendSession(${sessionNumber})">تعديل الوقت</button>
                                    <button onclick="cancelSession(${sessionNumber})">إلغاء الجلسة</button>`;
        document.getElementById('notifications').appendChild(sessionElement);

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = endTime - now;
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.getElementById(`countdown-${sessionNumber}`).innerHTML = `الوقت المتبقي: ${minutes} دقيقة و ${seconds} ثانية`;

            if (distance < 0) {
                clearInterval(countdownInterval);
                document.getElementById(`countdown-${sessionNumber}`).innerHTML = "انتهى الوقت!";
                const audio = new Audio('buzzer.mp3');
                audio.play();
                if ('speechSynthesis' in window) {
                    const message = `جلسة ${sessionNumber} انتهى وقتهم`;
                    const utterance = new SpeechSynthesisUtterance(message);
                    speechSynthesis.speak(utterance);
                } else {
                    alert("خاصية النطق غير مدعومة في هذا المتصفح.");
                }
                setTimeout(() => {
                    document.getElementById('notifications').removeChild(sessionElement);
                    const recordElement = document.createElement('div');
                    recordElement.className = 'session';
                    recordElement.innerHTML = `<h2>${sessionName}</h2>
                                               <div>الزبون: ${customerName}</div>
                                               <div>وقت البدء: ${startTime.toLocaleTimeString()}</div>
                                               <div>وقت الانتهاء: ${endTime.toLocaleTimeString()}</div>`;
                    sessionRecords.appendChild(recordElement);
                    removeSessionFromLocalStorage(sessionNumber);
                }, 60000); // إزالة العنصر بعد دقيقة واحدة
            }
        }

        updateCountdown(); // الاستدعاء الأولي لإظهار العد التنازلي فوراً
        const countdownInterval = setInterval(updateCountdown, 1000);

        // إضافة وظائف تعديل الوقت وإلغاء الجلسة
        window.extendSession = function(sessionNumber) {
            const additionalTime = prompt("أدخل الوقت الإضافي بالدقائق:");
            if (additionalTime) {
                const additionalTimeMs = parseInt(additionalTime, 10) * 60000;
                endTime = new Date(endTime.getTime() + additionalTimeMs);
                saveSessionToLocalStorage(sessionNumber, {
                    customerName: customerName,
                    startTime: startTime,
                    endTime: endTime
                });
                alert(`تم إضافة ${additionalTime} دقيقة إلى الجلسة ${sessionNumber}.`);
            }
        };

        window.cancelSession = function(sessionNumber) {
            const confirmCancel = confirm("هل أنت متأكد من إلغاء الجلسة؟");
            if (confirmCancel) {
                clearInterval(countdownInterval);
                document.getElementById('notifications').removeChild(document.getElementById(`session-${sessionNumber}`));
                removeSessionFromLocalStorage(sessionNumber);
                alert(`تم إلغاء الجلسة ${sessionNumber}.`);
            }
        };
    }
}});
