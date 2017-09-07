import {ComponentFixture, TestBed } from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { DebugElement }    from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/filter';

import {FlogoFormBuilderCommon} from '../../flogo.form-builder/form-builder.common';
import {IFlogoApplicationModel} from '../../../common/application.model';
import { FlogoFormBuilderConfigurationTaskComponent } from './form-builder.configuration.task.component'
import { FormBuilderModule } from './../../flogo.form-builder/flogo.form-builder.module';

describe('Form-builder component', () => {
  let comp: FlogoFormBuilderConfigurationTaskComponent, fixture: ComponentFixture<FlogoFormBuilderConfigurationTaskComponent>,
    de: DebugElement, el: HTMLElement;

  function compileComponent() {
    return TestBed.compileComponents();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormBuilderModule ],


      declarations: [],
      providers: [
        {provide: FlogoFormBuilderCommon, useClass: FlogoFormBuilderCommon}
      ]
    });
  });

  it('Should map the result of the previous task', (done) => {
    compileComponent()
      .then(() => {
        fixture = TestBed.createComponent(FlogoFormBuilderConfigurationTaskComponent);
        comp = fixture.componentInstance;
        comp._attributes = getMockAttributes();
        comp._task = getMockTask();
        comp._fieldObserver = new ReplaySubject(2);
        comp.refreshInputs();

        let messageInput = comp.fields.inputs.find((field) => field.name === 'message');
        const control = comp.getTaskInfo(messageInput, 'input', 'input');
        expect(control.value).toEqual(5);
        done();

        function getMockAttributes ()  {
          return {
            inputs:[{name:"message",type:0,value:null,mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],
              step:{
                flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}},
              {name:"flowInfo",type:3,value:"true",mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}},
              {name:"addToFlow",type:3,value:true,mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}}],
            outputs:[{name:"message",type:0,step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}}]};
        }

        function getMockTask() {
          return {
            type:1,activityType:"tibco-log",name:"Logger",version:"0.0.1",title:"Log Activity",description:"To log the number",homepage:"",
            attributes:{
              inputs:[{name:"message",type:0,value:null,mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:"5"},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}},{name:"flowInfo",type:3,value:"true",mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}},{name:"addToFlow",type:3,value:"true",mappings:[{type:1,mapTo:"message",value:"{A2.value}"}],step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}}],
              outputs:[{name:"message",type:0,step:{flow:{attributes:[{name:"{A2.value}",type:"integer",value:5},{name:"{A3.message}",type:"string",value:""}],state:0,status:500},id:"3",taskId:3,tasks:null}}]},
            author:"Anonymous",where:"",installed:true,id:"Mw",
            inputMappings:[{type:1,mapTo:"message",value:"{A2.value}"}]}
        }

      });
  });

});