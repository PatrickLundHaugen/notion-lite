import { TextSelection, Selection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

export function focusNextNode(editor: Editor) {
  const { state, view } = editor;
  const { doc, selection } = state;

  const nextSel = Selection.findFrom(selection.$to, 1, true);
  if (nextSel) {
    view.dispatch(state.tr.setSelection(nextSel).scrollIntoView());
    return true;
  }

  const paragraphType = state.schema.nodes.paragraph;
  if (!paragraphType) {
    console.warn("No paragraph node type found in schema.");
    return false;
  }

  const end = doc.content.size;
  const para = paragraphType.create();
  let tr = state.tr.insert(end, para);

  const $inside = tr.doc.resolve(end + 1);
  tr = tr.setSelection(TextSelection.near($inside)).scrollIntoView();
  view.dispatch(tr);
  return true;
}

export function isValidPosition(pos: number | null | undefined): pos is number {
  return typeof pos === "number" && pos >= 0;
}
