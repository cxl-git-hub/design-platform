/**
 * TypeScript 类型定义
 */

export interface Asset {
  id: number;
  type: 'image' | 'font' | 'psd';
  original_name: string;
  file_path: string;
  thumbnail_path: string | null;
  tags: string[];
  meta_info: Record<string, any> | null;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  cover_image: string | null;
  canvas_width: number;
  canvas_height: number;
  category: string | null;
  tags: string[];
  layer_count: number;
  cutout_slots: number;
}

export interface TemplateDetail extends Template {
  canvas_json: any;
  layers: TemplateLayer[];
}

export interface TemplateLayer {
  fabric_object_id: string;
  layer_name: string;
  is_ai_cutout_slot: boolean;
  placeholder_text: string | null;
}

export interface Project {
  id: number;
  name: string;
  canvas_width: number;
  canvas_height: number;
  canvas_json: any | null;
  cover_image: string | null;
  referenced_asset_ids: number[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  token: string;
}

export interface CutoutResult {
  output_path: string;
  data_url: string;
  message: string;
}
