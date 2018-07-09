import { GraphNode, Item } from '@flogo/core';
import { isIterableTask } from '@flogo/shared/utils';
import { FlowState } from '../flow.state';
import { getGraphName, getItemsDictionaryName } from '../../utils';
import { HandlerType } from '@flogo/flow/core/models/handler-type';

export function nodeUpdate(state: FlowState, payload: { handlerType: HandlerType, node?: Partial<GraphNode> }) {
  const { handlerType, node } = payload;
  if (!node) {
    return state;
  }
  const itemsDictionaryName = getItemsDictionaryName(handlerType);
  const graphName = getGraphName(handlerType);
  const graph = state[graphName];
  const currentNode = graph.nodes[node.id];
  const item = state[itemsDictionaryName][node.id];
  const newNodeState: GraphNode = {
    ...currentNode,
    ...node,
    status: {
      ...currentNode.status,
      ...(node.status || {}),
      iterable: isIterableTask(item),
    },
  };
  return {
    ...state,
    [graphName]: {
      ...graph,
      nodes: {
        ...graph.nodes,
        [node.id]: newNodeState
      }
    }
  };
}

export function itemUpdate(state: FlowState, payload: { handlerType: HandlerType, item?: {id: string} & Partial<Item> }) {
  const {handlerType, item} = payload;
  if (!item) {
    return state;
  }
  const itemsDictionaryName = getItemsDictionaryName(handlerType);
  const items = state[itemsDictionaryName];
  const newItemState = {...items[item.id], ...item};
  return {
    ...state,
    [itemsDictionaryName]: {
      ...items,
      [item.id]: newItemState,
    },
  };
}
