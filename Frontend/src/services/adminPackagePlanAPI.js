/**
 * Admin Package Plan API Service
 * Quản lý API cho PackagePlan trong admin
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AdminPackagePlanAPI {
    constructor() {
        this.baseURL = `${API_BASE_URL}/package-plans`;
    }

    /**
     * Lấy token từ localStorage
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Lấy danh sách tất cả package plans cho admin (bao gồm inactive)
     */
    async getPackagePlans() {
        try {
            const response = await fetch(`${this.baseURL}/admin/plans`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error fetching package plans:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin chi tiết một package plan
     */
    async getPackagePlanById(id) {
        try {
            const response = await fetch(`${this.baseURL}/plans/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi lấy thông tin gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error fetching package plan:', error);
            throw error;
        }
    }

    /**
     * Tạo package plan mới
     */
    async createPackagePlan(packageData) {
        try {
            const response = await fetch(`${this.baseURL}/plans`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(packageData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi tạo gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error creating package plan:', error);
            throw error;
        }
    }

    /**
     * Cập nhật package plan
     */
    async updatePackagePlan(id, packageData) {
        try {
            const response = await fetch(`${this.baseURL}/plans/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(packageData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi cập nhật gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error updating package plan:', error);
            throw error;
        }
    }

    /**
     * Xóa package plan
     */
    async deletePackagePlan(id) {
        try {
            const response = await fetch(`${this.baseURL}/plans/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi xóa gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error deleting package plan:', error);
            throw error;
        }
    }

    /**
     * Tìm kiếm package plans
     */
    async searchPackagePlans(searchParams = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Thêm các tham số tìm kiếm
            if (searchParams.name) {
                queryParams.append('name', searchParams.name);
            }
            if (searchParams.status !== undefined) {
                queryParams.append('isActive', searchParams.status);
            }
            if (searchParams.minPrice) {
                queryParams.append('minPrice', searchParams.minPrice);
            }
            if (searchParams.maxPrice) {
                queryParams.append('maxPrice', searchParams.maxPrice);
            }

            const url = queryParams.toString() 
                ? `${this.baseURL}/plans?${queryParams.toString()}`
                : `${this.baseURL}/plans`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi tìm kiếm gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error searching package plans:', error);
            throw error;
        }
    }

    /**
     * Bật/Tắt trạng thái package plan
     */
    async togglePackagePlanStatus(id, isActive) {
        try {
            const response = await fetch(`${this.baseURL}/plans/${id}/status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ isActive })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi thay đổi trạng thái gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error toggling package plan status:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách loại tin (PropertiesPackage) để tạo gói
     */
    async getPropertiesPackages() {
        try {
            const response = await fetch(`${this.baseURL}/properties-packages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách loại tin');
            }

            return data;
        } catch (error) {
            console.error('Error fetching properties packages:', error);
            throw error;
        }
    }

    /**
     * Khởi tạo gói tin mặc định
     */
    async initializeDefaultPackages() {
        try {
            const response = await fetch(`${this.baseURL}/initialize-default`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi khởi tạo gói tin mặc định');
            }

            return data;
        } catch (error) {
            console.error('Error initializing default packages:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách gói có sẵn để nâng cấp (chỉ các gói active)
     */
    async getAvailablePackages() {
        try {
            const response = await fetch(`${this.baseURL}/plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách gói tin');
            }

            return data;
        } catch (error) {
            console.error('Error getting available packages:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi lấy danh sách gói tin'
            };
        }
    }
}

const adminPackagePlanAPI = new AdminPackagePlanAPI();
export default adminPackagePlanAPI;
