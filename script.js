document.addEventListener('DOMContentLoaded', function() {
    const correctPin = "1234"; // رمز الدخول الصحيح
    const pinContainer = document.getElementById('pin-container');
    const mainContainer = document.getElementById('main-container');
    const pinInput = document.getElementById('pin-input');
    const pinButton = document.getElementById('pin-button');
    const sessionRecords = document.getElementById('session-records');

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
        
        const sessionNumber = document.getElementById('sessionNumber').value;
        const rentalTime = parseInt(document.getElementById('rentalTime').value, 10);
        let endTime = new Date().getTime() + rentalTime * 60000;
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
                                    <button onclick="extendSession(${sessionNumber})">تعديل الوقت</button>
                                    <button onclick="cancelSession(${sessionNumber})">إلغاء الجلسة</button>`;
        document.getElementById('notifications').appendChild(sessionElement);

        saveSessionToLocalStorage(sessionNumber, endTime);

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
                    recordElement.innerHTML = `<h2>${sessionName}</h2><div>الوقت انتهى</div>`;
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
                endTime += additionalTimeMs;
                saveSessionToLocalStorage(sessionNumber, endTime);
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

    function saveSessionToLocalStorage(sessionNumber, endTime) {
        const sessions = JSON.parse(localStorage.getItem('sessions')) || {};
        sessions[sessionNumber] = endTime;
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
            const endTime = sessions[sessionNumber];
            const sessionName = `جلسة ${sessionNumber}`;
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session';
            sessionElement.id = `session-${sessionNumber}`;
            sessionElement.innerHTML = `<h2>${sessionName}</h2><div id="countdown-${sessionNumber}"></div>
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
                        recordElement.innerHTML = `<h2>${sessionName}</h2><div>الوقت انتهى</div>`;
                        sessionRecords.appendChild(recordElement);
                        removeSessionFromLocalStorage(sessionNumber);
                    }, 60000); // إزالة العنصر بعد دقيقة واحدة
                }
            }

            updateCountdown(); // الاستدعاء الأولي لإظهار العد التنازلي فوراً
            const countdownInterval = setInterval(updateCountdown, 1000);
        }
    }
});
