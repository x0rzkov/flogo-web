import { REF_SUBFLOW } from '@flogo-web/server/core';
import { mappingsToAttributes } from './mappings-to-attributes';

describe('exporter.mappings-to-attributes', () => {
  const testSchemas = {
    'github.com/TIBCOSoftware/flogo-contrib/activity/subflow': {
      ref: REF_SUBFLOW,
      inputs: [
        {
          name: 'mappings',
          type: 'array',
          required: true,
          display: {
            name: 'Mapper',
            type: 'mapper',
            mapperOutputScope: 'action.output',
          },
        },
      ],
    },
    activityschema1: {
      ref: 'activityschema1',
      inputs: [
        {
          name: 'attr2',
          type: 'complex_object',
          value: '',
        },
      ],
    },
    activityschema3: {
      ref: 'activityschema3',
      inputs: [
        {
          name: 'mappings',
          type: 'array',
          required: true,
          display: {
            name: 'Mapper',
            type: 'mapper',
            mapperOutputScope: 'action.output',
          },
        },
      ],
    },
  };

  test('Should prepare the empty attributes when there is no literal assignment mappings', () => {
    expect(
      mappingsToAttributes(
        {
          id: 'task1',
          activityRef: 'activityschema1',
          attributes: [
            { name: 'attr1', type: 'double' },
            { name: 'attr2', type: 'complex_object' },
          ],
          inputMappings: [
            {
              mapTo: 'attr1',
              type: 1,
              value: '$.flow.in1',
            },
          ],
        },
        testSchemas['activityschema1']
      )
    ).toEqual({
      id: 'task1',
      activityRef: 'activityschema1',
      attributes: [],
      inputMappings: [
        {
          mapTo: 'attr1',
          type: 1,
          value: '$.flow.in1',
        },
      ],
    });
  });

  test('Should prepare the attributes when there are literal assignments in mappings', () => {
    expect(
      mappingsToAttributes(
        {
          id: 'task1',
          activityRef: 'activityschema1',
          attributes: [
            { name: 'attr1', type: 'double' },
            { name: 'attr2', type: 'complex_object' },
          ],
          inputMappings: [
            {
              mapTo: 'attr1',
              type: 1,
              value: '$.flow.in1',
            },
            {
              mapTo: 'attr2',
              type: 2,
              value: 'Testing',
            },
          ],
        },
        testSchemas['activityschema1']
      )
    ).toEqual({
      id: 'task1',
      activityRef: 'activityschema1',
      attributes: [{ name: 'attr2', type: 'complex_object', value: 'Testing' }],
      inputMappings: [
        {
          mapTo: 'attr1',
          type: 1,
          value: '$.flow.in1',
        },
      ],
    });
  });

  test('Should not process anything for a subflow type tasks', () => {
    expect(
      mappingsToAttributes(
        {
          id: 'task3',
          activityRef: REF_SUBFLOW,
          attributes: [{ name: 'attr1', type: 'number' }],
          inputMappings: [
            {
              mapTo: 'attr1',
              type: 1,
              value: '$.flow.in1',
            },
          ],
        },
        testSchemas[REF_SUBFLOW]
      )
    ).toEqual({
      id: 'task3',
      activityRef: REF_SUBFLOW,
      attributes: [{ name: 'attr1', type: 'number' }],
      inputMappings: [
        {
          mapTo: 'attr1',
          type: 1,
          value: '$.flow.in1',
        },
      ],
    });
  });

  test('Should not process anything for a mapper type tasks', () => {
    expect(
      mappingsToAttributes(
        {
          id: 'task4',
          activityRef: 'activityschema3',
          attributes: [{ name: 'attr1', type: 'number' }],
          inputMappings: [
            {
              mapTo: 'attr3',
              type: 1,
              value: '$.flow.in2',
            },
          ],
        },
        testSchemas['activityschema3']
      )
    ).toEqual({
      id: 'task4',
      activityRef: 'activityschema3',
      attributes: [{ name: 'attr1', type: 'number' }],
      inputMappings: [
        {
          mapTo: 'attr3',
          type: 1,
          value: '$.flow.in2',
        },
      ],
    });
  });
});