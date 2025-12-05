import { Injectable } from '@angular/core';
import { Label } from '../models';

@Injectable({ providedIn: 'root' })
export class LabelColorService {
  private readonly colors = [
    '#0f62fe', '#6929c4', '#1192e8', '#005d5d', '#9f1853',
    '#fa4d56', '#198038', '#ee5396', '#b28600', '#8a3ffc'
  ];

  private readonly colorCache = new Map<string, string>();

  getColor(label: Label): string {
    const cached = this.colorCache.get(label.id);
    if (cached) {
      return cached;
    }

    const color = this.generateColor(label.name);
    this.colorCache.set(label.id, color);
    return color;
  }

  getColorByName(name: string): string {
    return this.generateColor(name);
  }

  private generateColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  }

  clearCache(): void {
    this.colorCache.clear();
  }
}
