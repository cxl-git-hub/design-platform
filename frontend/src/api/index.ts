/**
 * API 客户端 — 含 JWT 拦截器
 */
import axios from 'axios';
import type { Asset, Template, TemplateDetail, Project, User, CutoutResult } from '../types';

const api = axios.create({ baseURL: '/api' });

// ★ JWT 拦截器: 自动附带 Token
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ★ 响应拦截器: 401 自动跳转登录
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ========== 认证 ==========

export async function register(username: string, email: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data;
}

export async function login(username: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

// ========== 素材管理 ==========

export async function uploadAsset(
  file: File,
  assetType: string,
  saveToLibrary: boolean,
  tags?: string[],
): Promise<Asset & { meta_info: any }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('asset_type', assetType);
  formData.append('save_to_library', String(saveToLibrary));
  if (tags?.length) formData.append('tags', JSON.stringify(tags));
  const { data } = await api.post('/assets/upload', formData);
  return data;
}

export async function listAssets(type?: string): Promise<Asset[]> {
  const { data } = await api.get('/assets/list', { params: { asset_type: type } });
  return data;
}

export async function deleteAsset(id: number): Promise<void> {
  await api.delete(`/assets/${id}`);
}

// ========== 模板管理 ==========

export async function createTemplate(assetId: number, name: string, category?: string) {
  const { data } = await api.post('/templates/create', { asset_id: assetId, name, category });
  return data;
}

export async function listTemplates(category?: string): Promise<Template[]> {
  const { data } = await api.get('/templates/list', { params: { category } });
  return data;
}

export async function getTemplate(id: number): Promise<TemplateDetail> {
  const { data } = await api.get(`/templates/${id}`);
  return data;
}

// ========== 项目管理 ==========

export async function saveProject(project: {
  name: string;
  canvas_width: number;
  canvas_height: number;
  canvas_json: any;
  referenced_asset_ids?: number[];
  source_template_id?: number;
}) {
  const { data } = await api.post('/projects/save', project);
  return data;
}

export async function updateProject(id: number, project: {
  name: string;
  canvas_width: number;
  canvas_height: number;
  canvas_json: any;
  referenced_asset_ids?: number[];
}) {
  const { data } = await api.put(`/projects/${id}`, project);
  return data;
}

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get('/projects/list');
  return data;
}

export async function getProject(id: number): Promise<Project> {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function exportProject(canvasJson: any, format = 'PNG') {
  const { data } = await api.post('/projects/export', { canvas_json: canvasJson, format });
  return data;
}

// ========== AI 服务 ==========

export async function aiCutout(file: File): Promise<CutoutResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/ai/cutout', formData);
  return data;
}
