import React, { useEffect, useState } from 'react';

const Eyes = () => {
    const [rotate, setRotate] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calculate rotation for eyes
            const deltaX = mouseX - window.innerWidth / 2;
            const deltaY = mouseY - window.innerHeight / 2;
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // -180 because the pupil starts at the right (0 deg) but we want it to follow naturally? 
            // Actually the CSS setup has the pupil float right. So 0deg = pupil right.
            // Mouse right = 0 deg. Consistent.
            // But we need to offset based on initial css rotation if any. 
            // Let's try raw angle first.
            // Offset by -180 might be needed if the 'float:right' implies it's at 180 or 0. 
            // Standard atan2 returns 0 for right.
            // If pupil element is float:right inside the line, and line rotates...
            // 0 deg rotation of line = horizontal right. 
            setRotate(angle - 180);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="eyes-container">
            {/* Background image usually here, we'll keep it simple color */}
            <div className="eye-wrapper">
                <div className="eye-white">
                    <div className="eye-black">
                        <div style={{ transform: `translate(-50%, -50%) rotate(${rotate}deg)` }} className="eye-pupil-line">
                            <div className="eye-pupil"></div>
                        </div>
                    </div>
                </div>
                <div className="eye-white">
                    <div className="eye-black">
                        <div style={{ transform: `translate(-50%, -50%) rotate(${rotate}deg)` }} className="eye-pupil-line">
                            <div className="eye-pupil"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Eyes;
