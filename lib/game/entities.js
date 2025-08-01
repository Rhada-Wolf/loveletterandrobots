// lib/game/entities.js
let nextEntityId = 0;

export const createEntity = () => {
  return { id: nextEntityId++ };
};

export const addComponent = (entity, componentName, componentData) => {
  entity[componentName] = componentData;
  return entity;
};

export const removeComponent = (entity, componentName) => {
  delete entity[componentName];
  return entity;
};

export const hasComponent = (entity, componentName) => {
  return entity.hasOwnProperty(componentName);
};