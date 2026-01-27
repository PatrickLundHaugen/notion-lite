import type { Node as TiptapNode } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { isValidPosition } from "../utils/dom";

export function isMarkInSchema(markName: string, editor: Editor | null): boolean {
  return !!editor?.schema?.spec.marks.get(markName);
}

export function isNodeInSchema(nodeName: string, editor: Editor | null): boolean {
  return !!editor?.schema?.spec.nodes.get(nodeName);
}

export function isNodeTypeSelected(editor: Editor | null, types: string[] = []): boolean {
  if (!editor || !editor.state.selection) return false;
  const { selection } = editor.state;
  if (selection.empty) return false;
  if (selection instanceof NodeSelection) {
    return types.includes(selection.node.type.name);
  }
  return false;
}

export function findNodePosition(props: {
  editor: Editor | null;
  node?: TiptapNode | null;
  nodePos?: number | null;
}): { pos: number; node: TiptapNode } | null {
  const { editor, node, nodePos } = props;
  if (!editor || !editor.state?.doc) return null;
  const hasNode = node !== null && node !== undefined;
  const hasPos = isValidPosition(nodePos);

  if (!hasNode && !hasPos) return null;

  if (hasNode) {
    let found: { pos: number; node: TiptapNode } | null = null;
    editor.state.doc.descendants((currentNode, pos) => {
      if (currentNode === node) {
        found = { pos, node: currentNode };
        return false;
      }
      return true;
    });
    if (found) return found;
  }

  if (hasPos) {
    const foundNode = findNodeAtPosition(editor, nodePos!);
    if (foundNode) return { pos: nodePos!, node: foundNode };
  }

  return null;
}

export function findNodeAtPosition(editor: Editor, position: number) {
  try {
    const node = editor.state.doc.nodeAt(position);
    if (!node) {
      console.warn(`No node found at position ${position}`);
      return null;
    }
    return node;
  } catch (error) {
    console.error(`Error getting node at position ${position}:`, error);
    return null;
  }
}

export async function handleImageUpload(
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (!file) throw new Error("No file provided");
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large");

  for (let progress = 0; progress <= 100; progress += 10) {
    if (abortSignal?.aborted) throw new Error("Upload cancelled");
    await new Promise((r) => setTimeout(r, 500));
    onProgress?.({ progress });
  }

  return "/images/tiptap-ui-placeholder-image.jpg";
}
