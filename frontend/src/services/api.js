import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
});

const scanAPI = {
  getRecentScans() {
    return api.get("/scans/recent");
  },

  getScanById(id) {
    return api.get(`/scans/report/${id}`);
  },

  createScan(target) {
    return api.post("/scans/new", { target });
  },

  deleteScan(id) {
    return api.delete(`/scans/delete/${id}`);
  },

  searchScan(searchQuery) {
    return api.get(`/scans/search?q=${encodeURIComponent(searchQuery)}`);
  },

  downloadReport(id) {
    return api.get(`/scans/report/${id}/export`, {
      responseType: "blob",
    });
  },
}

export default scanAPI;