export const ROLES = [
    { id: 'admin', label: 'Admin', route: '/dashboard/admin' },
    { id: 'ambulance', label: 'Ambulance', route: '/dashboard/ambulance' },
    { id: 'fire', label: 'Fire Engine', route: '/dashboard/fire' },
    { id: 'disaster', label: 'Disaster Management', route: '/dashboard/disaster' },
    { id: 'police', label: 'Traffic Police', route: '/dashboard/police' },
    { id: 'installer', label: 'Traffic Lights Installer', route: '/dashboard/installer' }
];

export const USER_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    SUSPENDED: 'suspended'
};
