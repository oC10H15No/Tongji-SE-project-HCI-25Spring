// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('menu');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    const floorplan = document.getElementById('floorplan');
    const mapContainer = document.querySelector('.map-container');
    const roomNameEl = document.getElementById('roomName');
    const roomPersonnelEl = document.getElementById('roomPersonnel');
    const roomDescriptionEl = document.getElementById('roomDescription');
    const roomImagesEl = document.getElementById('roomImages');
    const searchInput = document.getElementById('searchInput');
    const searchResultsEl = document.getElementById('searchResults');
    const mainContent = document.querySelector('main');
    const searchButton = document.getElementById('searchButton'); 
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    const roomGuidanceEl = document.getElementById('roomGuidance');
    const roomDetailsContainerEl = document.getElementById('roomDetailsContainer');

    // Zoom control buttons
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');

    let currentSelectedMarker = null;
    let originalMarkerSizes = new Map(); // To store original marker sizes
    let currentScale = 1;
    let currentTranslate = { x: 0, y: 0 };
    
    let isSidebarAnimating = false; // Added: Flag for sidebar animation state
    let animationFrameId = null;    // Added: ID for requestAnimationFrame
    
    let isTransformUpdatePending = false; // Added: Flag for pending transform update

    const MIN_SCALE = 0.8; 
    const MAX_SCALE = 3;   
    const SCALE_STEP = 0.2; 


    // 动态生成菜单
    const roomTypes = {};
    roomsData.forEach(room => {
        if (!roomTypes[room.type]) {
            roomTypes[room.type] = [];
        }
        roomTypes[room.type].push(room);
    });

    for (const type in roomTypes) {
        const typeUl = document.createElement('ul');
        const typeLi = document.createElement('li');
        const typeLink = document.createElement('a');
        typeLink.href = '#';
        typeLink.textContent = type;
        typeLink.classList.add('menu-type-header'); // For styling parent items
        typeLink.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = typeLi.querySelector('.submenu');
            if (submenu) {
                submenu.style.display = submenu.style.display === 'none' || submenu.style.display === '' ? 'block' : 'none';
                typeLink.classList.toggle('open'); // For arrow indicator or styling
            }
        });
        typeLi.appendChild(typeLink);

        const submenuUl = document.createElement('ul');
        submenuUl.classList.add('submenu');
        // submenuUl.style.display = 'none'; // Initially hidden by CSS or default

        roomTypes[type].forEach(room => {
            const roomLi = document.createElement('li');
            const roomLink = document.createElement('a');
            roomLink.href = `#${room.id}`;
            // 修改二级菜单显示格式为 name - purpose
            const purposeText = room.purpose && room.purpose.toLowerCase() !== 'null' ? room.purpose : '未指定';
            roomLink.textContent = `${room.name} - ${purposeText}`; 
            roomLink.dataset.roomId = room.id; // Store room ID for easy access
            roomLink.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedRoom = roomsData.find(r => r.id === room.id);
                if (clickedRoom) {
                    displayRoomInfo(clickedRoom);
                    highlightMarker(document.getElementById(`marker-${clickedRoom.id}`));
                }
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) { // Close sidebar on mobile after selection
                    sidebar.classList.remove('open');
                    menuToggleBtn.textContent = '☰'; // Reset button text
                    // Adjust main content padding if necessary
                     mainContent.style.paddingLeft = '10px'; 
                     // menuToggleBtn.style.left = '10px'; // Button position is static
                }
            });
            roomLi.appendChild(roomLink);
            submenuUl.appendChild(roomLi);
        });
        typeLi.appendChild(submenuUl);
        typeUl.appendChild(typeLi);
        menu.appendChild(typeUl);
    }

    // 菜单展开/收起
    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            menuToggleBtn.textContent = '✕'; // Changed to X for close
             if (window.innerWidth > 768) {
                mainContent.style.paddingLeft = '260px';
            } else {
                 mainContent.style.paddingLeft = '10px'; 
            }
        } else {
            menuToggleBtn.textContent = '☰'; // Changed to hamburger icon
            mainContent.style.paddingLeft = '10px';
        }
        
        // Start animation loop for marker positions
        if (!isSidebarAnimating) {
            isSidebarAnimating = true;
            if (animationFrameId) { // Clear any lingering frame
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(sidebarAnimationLoop);
        }
    });

    // Added: Animation loop function for sidebar transition
    function sidebarAnimationLoop() {
        if (!isSidebarAnimating) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            return; // Stop the loop
        }
        updateMarkerPositions();
        animationFrameId = requestAnimationFrame(sidebarAnimationLoop);
    }

    // Listen for transitionend on mainContent to update markers
    mainContent.addEventListener('transitionend', (event) => {
        // Ensure the transition is for 'padding-left' to avoid reacting to other transitions
        if (event.propertyName === 'padding-left') {
            isSidebarAnimating = false; // Stop the animation loop
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            // updateMarkerPositions(); // Final update for precision - This might be redundant if applyTransform is called
            // applyTransform(); // Apply transform which includes updating markers
            requestTransformUpdate(); // Request update after sidebar animation
        }
    });

    // Added: Function to request a transform update on the next animation frame
    function requestTransformUpdate() {
        if (!isTransformUpdatePending) {
            isTransformUpdatePending = true;
            requestAnimationFrame(() => {
                applyTransform();
                isTransformUpdatePending = false;
            });
        }
    }
    
    function applyTransform() {
        if (!floorplan) return;
        // Apply scale and translate to the floorplan image
        floorplan.style.transformOrigin = 'center center'; // Ensure origin is center for scaling
        floorplan.style.transform = `translate(${currentTranslate.x}px, ${currentTranslate.y}px) scale(${currentScale})`;
        
        // Update marker positions and their individual scales
        updateMarkerPositions(); // This will now correctly use currentScale and currentTranslate
        
        // Adjust marker visual size (direct scaling with map)
        document.querySelectorAll('.room-marker').forEach(marker => {
            const roomId = marker.id.split('-')[1];
            const originalRadius = originalMarkerSizes.get(roomId) || 10; // Default if not found
            const adjustedRadius = originalRadius * currentScale; // Changed: Direct scaling
            marker.style.width = `${adjustedRadius * 2}px`;
            marker.style.height = `${adjustedRadius * 2}px`;
            // Adjust font size if markers contain text and it needs to be readable
            // marker.style.fontSize = `${10 * currentScale}px`; // Example if you had text in markers
        });
    }


    function updateMarkerPositions() {
        if (!floorplan || !floorplan.naturalWidth || !floorplan.naturalHeight) {
            return; // Exit if floorplan or its dimensions are not available
        }

        const naturalWidth = floorplan.naturalWidth;
        const naturalHeight = floorplan.naturalHeight;
        
        // Use floorplan.clientWidth and clientHeight for object-fit calculations,
        // as these are not affected by the element\'s transform property.
        const elementClientWidth = floorplan.clientWidth;
        const elementClientHeight = floorplan.clientHeight;

        if (elementClientWidth <= 0 || elementClientHeight <= 0) return; // Avoid division by zero or invalid calculations

        // Calculate the scale factor of the image content due to object-fit: contain
        const objectFitScale = Math.min(elementClientWidth / naturalWidth, elementClientHeight / naturalHeight);

        // Calculate the dimensions of the rendered image content *before* floorplan\'s own transform
        const contentWidthPreTransform = naturalWidth * objectFitScale;
        const contentHeightPreTransform = naturalHeight * objectFitScale;

        // Calculate the offset of this rendered content within the floorplan element\'s own box (pre-transform)
        const contentOffsetXPreTransform = (elementClientWidth - contentWidthPreTransform) / 2;
        const contentOffsetYPreTransform = (elementClientHeight - contentHeightPreTransform) / 2;

        roomsData.forEach(room => {
            const marker = document.getElementById(`marker-${room.id}`);
            if (marker) {
                // The logical radius for positioning should be based on its *original* size,
                // then adjusted by the inverse scale if the marker itself is being scaled.
                // However, if marker.style.width/height are being set to maintain visual size,
                // then the baseRadius for *positioning* should be this maintained visual size divided by 2.
                // Let's use originalMarkerSizes for the logical center calculation.
                const originalRadius = originalMarkerSizes.get(room.id) || 10;
                const currentVisualRadius = originalRadius * currentScale; // Changed: Direct scaling for positioning offset


                // Marker center in natural image coordinates: (room.position.x, room.position.y)
                // Marker center relative to floorplan element\'s top-left, pre-transform:
                let markerAbsX = contentOffsetXPreTransform + room.position.x * objectFitScale;
                let markerAbsY = contentOffsetYPreTransform + room.position.y * objectFitScale;

                // Now apply the floorplan\'s transform (scale around center, then translate)
                // Floorplan\'s transform-origin is center center.
                const originX = elementClientWidth / 2;
                const originY = elementClientHeight / 2;

                // 1. Translate point so transform origin is (0,0)
                let relX = markerAbsX - originX;
                let relY = markerAbsY - originY;

                // 2. Scale the point (this is the floorplan's scale)
                let scaledX = relX * currentScale;
                let scaledY = relY * currentScale;

                // 3. Translate point back from origin and add currentTranslate
                let finalMarkerCenterX = scaledX + originX + currentTranslate.x;
                let finalMarkerCenterY = scaledY + originY + currentTranslate.y;
                
                // Position the marker using its top-left corner, considering its current visual size
                marker.style.left = `${finalMarkerCenterX - currentVisualRadius}px`;
                marker.style.top = `${finalMarkerCenterY - currentVisualRadius}px`;
            }
        });
    }


    // 在地图上动态生成房间标记点
    roomsData.forEach(room => {
        const marker = document.createElement('div');
        marker.classList.add('room-marker');
        marker.id = `marker-${room.id}`;
        marker.style.backgroundColor = room.marker.color;
        
        const radius = room.marker.radius;
        originalMarkerSizes.set(room.id, radius); // Store original radius

        marker.style.width = `${radius * 2}px`;
        marker.style.height = `${radius * 2}px`;
        marker.title = `${room.id}`;

        marker.addEventListener('click', () => {
            displayRoomInfo(room);
            highlightMarker(marker);
        });
        mapContainer.appendChild(marker);
    });
    
    if (floorplan.complete) {
        // updateMarkerPositions(); // applyTransform will call this
        // applyTransform();
        requestTransformUpdate(); // Initial transform
    } else {
        floorplan.onload = () => {
            // updateMarkerPositions();
            // applyTransform();
            requestTransformUpdate(); // Initial transform
        };
    }
    // window.addEventListener('resize', updateMarkerPositions);
    // window.addEventListener('resize', applyTransform);
    window.addEventListener('resize', requestTransformUpdate); // Update on resize


    function highlightMarker(markerToHighlight) {
        if (currentSelectedMarker) {
            currentSelectedMarker.classList.remove('selected');
        }
        if (markerToHighlight) {
            markerToHighlight.classList.add('selected');
            currentSelectedMarker = markerToHighlight;
        } else {
            currentSelectedMarker = null;
        }
    }

    function displayRoomInfo(room) {
        if (!room) { // If room is null, reset to default
            resetInfoPanel();
            return;
        }
        // 显示详情，隐藏引导信息
        if(roomGuidanceEl) roomGuidanceEl.style.display = 'none';
        if(roomDetailsContainerEl) roomDetailsContainerEl.style.display = 'block';

        // 修改右侧详细信息显示
        const purposeText = room.purpose && room.purpose.toLowerCase() !== 'null' ? room.purpose : '暂无信息';
        roomNameEl.textContent = `${room.name} - ${purposeText}`; // 修改标题显示

        // 更新 roomPurposeEl 为显示区域 (type)
        const roomTypeEl = document.getElementById('roomType'); // 假设你有一个ID为 roomType 的元素
        if (roomTypeEl) {
            roomTypeEl.textContent = room.type || '暂无信息';
        }

        roomDescriptionEl.textContent = room.description || '暂无信息'; // 确保空值时显示提示

        roomPersonnelEl.innerHTML = '';
        if (room.personnel && room.personnel.length > 0) {
            room.personnel.forEach(person => {
                const li = document.createElement('li');
                let personText = person.name;
                if (person.title && person.title.toLowerCase() !== 'null') personText += ` (${person.title})`;
                if (person.responsibility && person.responsibility.toLowerCase() !== 'null') personText += ` - ${person.responsibility}`;
                li.textContent = personText;
                roomPersonnelEl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = '暂无人员信息';
            roomPersonnelEl.appendChild(li);
        }

        roomImagesEl.innerHTML = '';
        if (room.images && room.images.length > 0) {
            room.images.forEach(imagePath => {
                const img = document.createElement('img');
                img.src = imagePath;
                img.alt = `房间 ${room.name} 图片 - ${imagePath.substring(imagePath.lastIndexOf('/') + 1)}`;
                img.addEventListener('click', () => {
                    if (imageModal && modalImage && closeModal) { // Ensure modal elements are present
                        modalImage.src = imagePath;
                        imageModal.style.display = 'block';
                    }
                });
                roomImagesEl.appendChild(img);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '暂无图片';
            roomImagesEl.appendChild(p);
        }

        // Highlight corresponding menu item
        document.querySelectorAll('#menu a').forEach(a => a.classList.remove('active'));
        const activeMenuLink = document.querySelector(`#menu a[data-room-id="${room.id}"]`);
        if (activeMenuLink) {
            activeMenuLink.classList.add('active');
            let parentLi = activeMenuLink.closest('li');
            if (parentLi) {
                let submenu = parentLi.closest('.submenu');
                if (submenu && (submenu.style.display === 'none' || submenu.style.display === '')) {
                    submenu.style.display = 'block';
                    // Also ensure parent type link is styled as open if it has such styling
                    const parentTypeLink = submenu.closest('li').querySelector('.menu-type-header');
                    if(parentTypeLink) parentTypeLink.classList.add('open');
                }
            }
        }
        highlightMarker(document.getElementById(`marker-${room.id}`));
        // Scroll info panel to top
        document.querySelector('.info-panel').scrollTop = 0;
    }

    // Added: Function to reset the info panel to its default state
    function resetInfoPanel() {
        roomNameEl.textContent = '欢迎使用导览系统';
        
        // 显示引导信息，隐藏详情
        if(roomGuidanceEl) roomGuidanceEl.style.display = 'block';
        if(roomDetailsContainerEl) roomDetailsContainerEl.style.display = 'none';

        // 清空详情内容（可选，因为它们是隐藏的）
        const roomTypeEl = document.getElementById('roomType');
        if (roomTypeEl) {
            roomTypeEl.textContent = '';
        }
        roomDescriptionEl.textContent = '';
        roomPersonnelEl.innerHTML = '';
        roomImagesEl.innerHTML = '';
        // Optionally, deselect any active menu item
        document.querySelectorAll('#menu a').forEach(a => a.classList.remove('active'));
        // Deselect marker is handled by resetZoom or when a new room is selected
    }


    // 点击外部关闭搜索结果和菜单
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container'); // Ensure searchContainer is defined locally or globally
        if (searchContainer && !searchContainer.contains(e.target) && e.target !== searchInput && e.target !== searchButton && !searchButton.contains(e.target)) {
            searchResultsEl.style.display = 'none';
        }
    });
    

    // 初始加载逻辑
    if (window.location.hash) {
        const roomId = window.location.hash.substring(1);
        const room = roomsData.find(r => r.id === roomId);
        if (room) {
            // Delay display to ensure layout is stable, especially for marker positioning
            setTimeout(() => {
                displayRoomInfo(room);
                highlightMarker(document.getElementById(`marker-${room.id}`));
            }, 100); // Small delay
        }
    } else if (roomsData.length > 0) {
        resetInfoPanel(); // Show welcome message on initial load
    }

    // Adjust padding of main content based on initial sidebar state (which is closed)
    mainContent.style.paddingLeft = '10px';

    // Modal close functionality (ensure it's present)
    if (imageModal && modalImage && closeModal) {
        closeModal.addEventListener('click', () => {
            imageModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    }

    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        searchResultsEl.innerHTML = '';
        if (query.length === 0) {
            searchResultsEl.style.display = 'none';
            return;
        }

        const results = [];
        roomsData.forEach(room => {
            // Search in room ID, name, purpose, description, and type
            if (room.id.toLowerCase().includes(query) ||
                room.name.toLowerCase().includes(query) ||
                (room.purpose && room.purpose.toLowerCase().includes(query)) ||
                (room.description && room.description.toLowerCase().includes(query)) ||
                (room.type && room.type.toLowerCase().includes(query))) {
                results.push({ type: 'room', data: room, text: `房间: ${room.name} (${room.purpose || room.type || '无详细分类'})` });
            }

            if (room.personnel) {
                room.personnel.forEach(person => {
                    // Search in person's name, title, and responsibility
                    if (person.name.toLowerCase().includes(query) ||
                        (person.title && person.title.toLowerCase().includes(query)) ||
                        (person.responsibility && person.responsibility.toLowerCase().includes(query))) {
                        const personResultText = `人员: ${person.name} (职位: ${person.title || '无'}, 责任: ${person.responsibility || '无'}) - 房间: ${room.name}`;
                        results.push({ type: 'person', data: room, text: personResultText });
                    }
                });
            }
        });
        
        // Deduplicate results using Set
        const uniqueResults = [];
        const addedTexts = new Set();
        results.forEach(result => {
            if (!addedTexts.has(result.text)) {
                uniqueResults.push(result);
                addedTexts.add(result.text);
            }
        });

        if (uniqueResults.length > 0) {
            uniqueResults.forEach(result => {
                const div = document.createElement('div');
                div.textContent = result.text;
                div.addEventListener('click', () => {
                    displayRoomInfo(result.data);
                    highlightMarker(document.getElementById(`marker-${result.data.id}`));
                    searchInput.value = ''; 
                    searchResultsEl.innerHTML = '';
                    searchResultsEl.style.display = 'none';
                    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                        sidebar.classList.remove('open');
                        menuToggleBtn.textContent = '☰'; 
                        mainContent.style.paddingLeft = '10px';
                    }
                });
                searchResultsEl.appendChild(div);
            });
            searchResultsEl.style.display = 'block';
        } else {
            const div = document.createElement('div');
            div.textContent = '无匹配结果';
            searchResultsEl.appendChild(div);
            searchResultsEl.style.display = 'block';
        }
    };

    searchInput.addEventListener('input', performSearch);
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Zoom Functionality
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentScale = Math.min(MAX_SCALE, currentScale + SCALE_STEP);
            // applyTransform();
            requestTransformUpdate();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentScale = Math.max(MIN_SCALE, currentScale - SCALE_STEP);
            // applyTransform();
            requestTransformUpdate();
        });
    }

    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            currentScale = 1;
            currentTranslate = { x: 0, y: 0 };
            // applyTransform();
            requestTransformUpdate();
            resetInfoPanel(); // Reset the info panel to default
            if (currentSelectedMarker) {
                currentSelectedMarker.classList.remove('selected');
                currentSelectedMarker = null;
            }
            // Also remove active class from menu
             document.querySelectorAll('#menu a.active').forEach(a => a.classList.remove('active'));
        });
    }

    // Basic Drag/Pan Functionality
    let isDragging = false;
    let dragStartX, dragStartY;
    let initialTranslateX, initialTranslateY;

    if (floorplan) {
        floorplan.addEventListener('mousedown', (e) => {
            // Prevent dragging if interacting with markers or other elements on top
            if (e.target !== floorplan) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            initialTranslateX = currentTranslate.x;
            initialTranslateY = currentTranslate.y;
            floorplan.style.cursor = 'grabbing';
            e.preventDefault(); // Prevent image dragging behavior
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            currentTranslate.x = initialTranslateX + dx;
            currentTranslate.y = initialTranslateY + dy;
            // applyTransform();
            requestTransformUpdate(); // Request update on drag
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if(floorplan) floorplan.style.cursor = 'grab';
            }
        });
        
        floorplan.addEventListener('mouseleave', () => { // Stop dragging if mouse leaves map container
            if (isDragging) {
                isDragging = false;
                if(floorplan) floorplan.style.cursor = 'grab';
            }
        });
        if(floorplan) floorplan.style.cursor = 'grab'; // Initial cursor
    }
});

