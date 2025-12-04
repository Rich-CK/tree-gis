document.addEventListener('DOMContentLoaded', () => {
    const gpsXInput = document.getElementById('gpsX');
    const gpsYInput = document.getElementById('gpsY');
    const refreshGpsBtn = document.getElementById('refreshGps');

    const btnCamera = document.getElementById('btnCamera');
    const btnUpload = document.getElementById('btnUpload');
    const cameraInput = document.getElementById('cameraInput');
    const photoInput = document.getElementById('photoInput');
    const photoNameInput = document.getElementById('photoName');
    const photoPreview = document.getElementById('photoPreview');
    const previewContainer = document.getElementById('previewContainer');

    const treeForm = document.getElementById('treeForm');
    const btnCancel = document.getElementById('btnCancel');

    let currentPhotoFile = null;

    // --- GPS Logic ---
    function fetchGPS() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    gpsXInput.value = position.coords.longitude.toFixed(6);
                    gpsYInput.value = position.coords.latitude.toFixed(6);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("無法取得 GPS 位置，請手動輸入或檢查權限。");
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert("您的裝置不支援 GPS 定位。");
        }
    }

    // --- ID Generation Logic ---
    function generateUniqueId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `T-${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    // Auto-fetch on load
    fetchGPS();
    document.getElementById('treeId').value = generateUniqueId();

    // Manual refresh
    refreshGpsBtn.addEventListener('click', fetchGPS);

    // --- Photo Logic ---
    btnCamera.addEventListener('click', () => {
        cameraInput.click();
    });

    btnUpload.addEventListener('click', () => {
        photoInput.click();
    });

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            currentPhotoFile = file;
            photoNameInput.value = file.name;

            // Preview
            const reader = new FileReader();
            reader.onload = function (e) {
                photoPreview.src = e.target.result;
                previewContainer.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }

    cameraInput.addEventListener('change', handleFileSelect);
    photoInput.addEventListener('change', handleFileSelect);

    // --- Form Submission ---
    treeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Upload Photo first if exists
        let photoPath = "";
        if (currentPhotoFile) {
            const formData = new FormData();
            formData.append('photo', currentPhotoFile);

            try {
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Photo upload failed');

                const uploadData = await uploadRes.json();
                photoPath = uploadData.filename;
            } catch (err) {
                console.error(err);
                alert("照片上傳失敗！");
                return;
            }
        }

        // 2. Save Data
        const data = {
            id: document.getElementById('treeId').value,
            species: document.getElementById('species').value,
            gpsX: gpsXInput.value,
            gpsY: gpsYInput.value,
            height: document.getElementById('height').value,
            diameter: document.getElementById('diameter').value,
            photoPath: photoPath
        };

        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("資料儲存成功！");
                // Reset form
                treeForm.reset();
                currentPhotoFile = null;
                photoNameInput.value = "";
                previewContainer.style.display = 'none';
                fetchGPS(); // Re-fetch GPS for next entry
            } else {
                alert("資料儲存失敗！");
            }
        } catch (err) {
            console.error(err);
            alert("發生錯誤，請稍後再試。");
        }
    });

    // --- Cancel Button ---
    btnCancel.addEventListener('click', () => {
        if (confirm("確定要取消並清空表單嗎？")) {
            treeForm.reset();
            currentPhotoFile = null;
            photoNameInput.value = "";
            previewContainer.style.display = 'none';
            fetchGPS();
        }
    });
});
