/**
 * Canvas 历史管理器 — 撤销/重做
 *
 * 原理: 监听 canvas 的 object:modified / object:added / object:removed 事件
 * 每次变化时保存 canvas JSON 快照到栈中
 */
import type { Canvas } from 'fabric';

const MAX_HISTORY = 50;

export class CanvasHistory {
  private canvas: Canvas;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private locked = false;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.saveState();
    this.bindEvents();
  }

  private bindEvents() {
    const save = () => {
      if (!this.locked) this.saveState();
    };
    this.canvas.on('object:added', save);
    this.canvas.on('object:modified', save);
    this.canvas.on('object:removed', save);
  }

  saveState() {
    const json = JSON.stringify(this.canvas.toJSON());
    this.undoStack.push(json);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  async undo() {
    if (this.undoStack.length <= 1) return;
    this.locked = true;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    await this.canvas.loadFromJSON(JSON.parse(prev));
    this.canvas.requestRenderAll();
    this.locked = false;
  }

  async redo() {
    if (this.redoStack.length === 0) return;
    this.locked = true;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    await this.canvas.loadFromJSON(JSON.parse(next));
    this.canvas.requestRenderAll();
    this.locked = false;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  destroy() {
    this.canvas.off('object:added');
    this.canvas.off('object:modified');
    this.canvas.off('object:removed');
  }
}
