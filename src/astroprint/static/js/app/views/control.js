/*
 *  (c) 3DaGoGo, Inc. (product@astroprint.com)
 *
 *  Distributed under the GNU Affero General Public License http://www.gnu.org/licenses/agpl.html
 */
var TempView = Backbone.View.extend({
  className: 'control-temps small-12 columns',
  el: '#temp-control-template',
  semiCircleTemp_views: {},
  navExtruders_views: {},
  extruders_count: null,
  socketTemps: null,
  heated_bed: null,
  initialize: function()
  {
    new SemiCircleProgress();

    var profile = app.printerProfile.toJSON();
    this.extruders_count = profile.extruder_count;
    this.heated_bed = profile.heated_bed;
    this.renderCircleTemps();
  },
  renderCircleTemps: function() {
    if (app.socketData.attributes.temps != this.socketTemps) {
      this.socketTemps = app.socketData.attributes.temps;
    }
    var temps = null;

    var semiCircleTemp = null;

    //extruders
    for (var i = 0; i < this.extruders_count; i++) {
      semiCircleTemp = new TempSemiCircleView({'tool': i, enableOff: true});
      this.semiCircleTemp_views[i] = semiCircleTemp;
      this.$el.find('.extruders').append(this.semiCircleTemp_views[i].render().el);

      if (this.socketTemps.lenght > 0) {
        temps = {current: this.socketTemps.extruders[i].current, target: this.socketTemps.extruders[i].target};
      } else {
        temps = {current: null, target: null};
      }

      this.semiCircleTemp_views[i].setTemps(temps.current, temps.target);
      //nav-extruders
      var tempId = "temp-" + i;
      this.navExtruders_views[i] = '<h4 id='+ tempId +'>' + (i+1) + '<br><span class="all-temps"></span></h4>';
      this.$el.find('.nav-extruders').append(this.navExtruders_views[i]);
    }

    //bed
    if (this.heated_bed) {
      this.$el.find('#bed-container').removeClass('no-bed');
    } else {
      this.$el.find('#bed-container').addClass('no-bed');
    }
    semiCircleTemp = new TempSemiCircleView({'tool': null, enableOff: true});
    this.semiCircleTemp_views[this.extruders_count] = semiCircleTemp;
    this.$el.find('.bed').append(this.semiCircleTemp_views[this.extruders_count].render().el);

    if (this.socketTemps.lenght > 0) {
      temps = {current: this.socketTemps.bed.current, target: this.socketTemps.bed.target};
    } else {
      temps = {current: null, target: null};
    }

    this.semiCircleTemp_views[this.extruders_count].setTemps(temps.current, temps.target);

    for (var i = 0; i <= this.extruders_count; i++) {
      $("#"+this.semiCircleTemp_views[i].el.id+" .progress-temp-circle").circleProgress({
        value: temps.current,
        arcCoef: 0.55,
        size: 180,
        thickness: 20,
        fill: { gradient: ['#60D2E5', '#E8A13A', '#F02E19'] }
      });
    }

    if (this.$('.extruders').hasClass('slick-initialized')) {
      console.log("antes del unslick")
      this.$('.extruders').slick('getSlick').unslick();
    }
    if (this.$('.nav-extruders').hasClass('slick-initialized')) {
      console.log("antes del unslick")
      this.$('.nav-extruders').slick('getSlick').unslick();
    }

    this.$('.extruders').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      infinite: false,
      adaptiveHeight: true,
      fade: true,
      asNavFor: this.$('.nav-extruders')
    });
    this.$('.nav-extruders').slick({
      slidesToShow: 5,
      slidesToScroll: 1,
      arrows: true,
      adaptiveHeight: true,
      centerMode: true,
      centerPadding: '10px',
      infinite: false,
      focusOnSelect: true,
      prevArrow: '<i class="icon-angle-left"></i>',
      nextArrow: '<i class="icon-angle-right"></i>',
      asNavFor: this.$('.extruders')
    });

    if (this.socketTemps.length > 0){
      this.updateTemps(this.socketTemps);
    }

  },
  updateTemps: function(value) {
    var temps = {};

    for (var i = 0; i < Object.keys(this.semiCircleTemp_views).length; i++) {
      if (this.semiCircleTemp_views[i].el.id == 'bed' ) {
        temps = {'current': value.bed.actual, 'target': value.bed.target};
      } else {
        temps = {'current': value.extruders[i].current, 'target': value.extruders[i].target};
      }
      (this.semiCircleTemp_views[i]).updateValues(temps);

      if (this.semiCircleTemp_views[i].type == 'tool') {
        var search = '#temp-'+i;
        this.$el.find(search).find('.all-temps').text(this.semiCircleTemp_views[i].actual);
      }

    }
  },
  show: function()
  {
    var semiCircleCount = Object.keys(this.semiCircleTemp_views).length;

    if ( semiCircleCount ) {
      var socketTemps = app.socketData.attributes.temps;

      for (var i = 0; i < semiCircleCount; i++) {
        if (i != this.extruders_count) {
          if (_.has(socketTemps, 'extruders')) {
            temps = {current: socketTemps.extruders[i].current, target: socketTemps.extruders[i].target};
          } else {
            temps = {current: null, target: null};
          }
        } else {
          if (_.has(socketTemps, 'bed')) {
            temps = {current: socketTemps.bed.actual, target: socketTemps.bed.target};
          } else {
            temps = {current: null, target: null};
          }
        }

        if ($("#control-view").hasClass('print-paused')) {
          this.semiCircleTemp_views[i].enableTurnOff(false);
        } else {
          this.semiCircleTemp_views[i].enableTurnOff(true);
        }

        this.semiCircleTemp_views[i].updateValues(temps);
      }

      if (this.$('.extruders').hasClass('slick-initialized')) {
        console.log("antes del unslick SHOW extruders")
        //this.extrudersSlide.slick('getSlick').unslick();
        this.$('.extruders').slick('unslick');
      }
        if (this.$('.nav-extruders').hasClass('slick-initialized')) {
        console.log("antes del unslick SHOW nav")
        //this.$('.nav-extruders').slick('getSlick').unslick();
        this.$('.nav-extruders').slick('unslick');
      }

      /*this.extrudersSlide = this.$('.extruders').slick({
        arrows: true,
        prevArrow: '<i class="icon-angle-left"></i>',
        nextArrow: '<i class="icon-angle-right"></i>',
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: false,
        dots: true,
        adaptiveHeight: true,
        customPaging : function(slider, i) {
          var thumb = $(slider.$slides[i]).data();
          var tempId = "temp-" + i;
          return '<a>'+(i+1)+'</a><br><span class="all-temps" id='+tempId+'></span>';
        }
      });*/


      this.$('.extruders').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: false,
        adaptiveHeight: true,
        fade: true,
        asNavFor: this.$('.nav-extruders')
      });
      this.$('.nav-extruders').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        arrows: true,
        adaptiveHeight: true,
        centerMode: true,
        centerPadding: '10px',
        infinite: false,
        focusOnSelect: true,
        prevArrow: '<i class="icon-angle-left"></i>',
        nextArrow: '<i class="icon-angle-right"></i>',
        asNavFor: this.$('.extruders')
      });

    }
  }
});

var DistanceControl = Backbone.View.extend({
  el: '#distance-control',
  selected: 10,
  events: {
    'click button': 'selectDistance'
  },
  selectDistance: function(e)
  {
    var el = $(e.currentTarget);
    this.$el.find('.success').removeClass('success').addClass('secondary');
    el.addClass('success').removeClass('secondary');
    this.selected = el.attr('data-value');
  }
});

var MovementControlView = Backbone.View.extend({
  distanceControl: null,
  printerProfile: null,
  initialize: function(params)
  {
    this.distanceControl = params.distanceControl;
  },
  sendJogCommand: function(axis, multiplier, distance)
  {
    if (typeof distance === "undefined")
      distance = 10;

    var data = {
      "command": "jog"
    }
    data[axis] = distance * multiplier;

    $.ajax({
      url: API_BASEURL + "printer/printhead",
      type: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(data)
    });
  },
  sendHomeCommand: function(axis)
  {
    var data = {
      "command": "home",
      "axes": axis
    }

    $.ajax({
      url: API_BASEURL + "printer/printhead",
      type: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(data)
    });
  }
});

var XYControlView = MovementControlView.extend({
  el: '#xy-controls',
  events: {
    'click .control_btn_x_plus': 'xPlusTapped',
    'click .control_btn_x_minus': 'xMinusTapped',
    'click .control_btn_y_plus': 'yPlusTapped',
    'click .control_btn_y_minus': 'yMinusTapped',
    'click .home_z': 'homeTapped'
  },
  xPlusTapped: function()
  {
    this.sendJogCommand('x', 1, this.distanceControl.selected);
  },
  xMinusTapped: function()
  {
    this.sendJogCommand('x', -1, this.distanceControl.selected);
  },
  yPlusTapped: function()
  {
    this.sendJogCommand('y', 1, this.distanceControl.selected);
  },
  yMinusTapped: function()
  {
    this.sendJogCommand('y', -1, this.distanceControl.selected);
  },
  homeTapped: function()
  {
    if (!app.socketData.get('paused')) {
      this.sendHomeCommand(['x', 'y']);
    }
  }
});

var ZControlView = MovementControlView.extend({
  el: '#z-controls',
  events: {
    'click .control_btn_z_plus': 'zPlusTapped',
    'click .control_btn_z_minus': 'zMinusTapped',
    'click .home_z': 'homeTapped'
  },
  zPlusTapped: function()
  {
    this.sendJogCommand('z', 1, this.distanceControl.selected);
  },
  zMinusTapped: function()
  {
    this.sendJogCommand('z', -1 , this.distanceControl.selected);
  },
  homeTapped: function()
  {
    if (!app.socketData.get('paused')) {
      this.sendHomeCommand('z');
    }
  }
});

var ExtrusionControlView = Backbone.View.extend({
  el: '#extrusion-control',
  template: null,
  events: {
    'click .extrude': 'extrudeTapped',
    'click .retract': 'retractTapped',
    'change .extrusion-length': 'lengthChanged',
    'change .extrusion-speed': 'speedChanged',
    'keydown input.back-to-select': 'onKeyDownBackToSelect'
  },
  initialize: function()
  {
    this.template = _.template( this.$("#extruder-switch-template").html() );
  },
  render: function()
  {
    var printer_profile = app.printerProfile.toJSON();

    this.$('.row.extruder-switch').html(this.template({
      profile: printer_profile
    }));

    if (printer_profile.extruder_count > 1) {
      this.events['change .extruder-number'] = "extruderChanged";
    }

    this.delegateEvents(this.events);
  },
  extrudeTapped: function()
  {
    if (this._checkAmount()) {
      this._sendExtrusionCommand(1);
    }
  },
  retractTapped: function()
  {
    if (this._checkAmount()) {
      this._sendExtrusionCommand(-1);
    }
  },
  lengthChanged: function(e)
  {
    var elem = $(e.target);

    if (elem.val() == 'other') {
      elem.addClass('hide');
      this.$('.other-length').removeClass('hide').find('input').focus().select();
    } else {
      this.$('input[name="extrusion-length"]').val(elem.val());
    }
  },
  speedChanged: function(e)
  {
    var elem = $(e.target);

    if (elem.val() == 'other') {
      elem.addClass('hide');
      this.$('.other-speed').removeClass('hide').find('input').focus().select();
    } else {
      this.$('input[name="extrusion-speed"]').val(elem.val());
    }
  },
  extruderChanged: function(e)
  {
    this._sendChangeToolCommand($(e.target).val())
  },
  onKeyDownBackToSelect: function(e)
  {
    if (e.keyCode == 27) { //ESC Key
      var target = $(e.currentTarget);
      var select = target.closest('div.select-with-text').find('select');

      //Find out the default value. Middle one
      var defaultValue = select.find('option[default]').val();

      target.closest('.row').addClass('hide');
      target.val(defaultValue);
      select.removeClass('hide').val(defaultValue);
    }
  },
  _sendChangeToolCommand: function(tool)
  {
    var data = {
      command: "select",
      tool: 'tool'+tool
    }

    $.ajax({
      url: API_BASEURL + "printer/tool",
      type: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(data)
    });
  },
  _checkAmount: function()
  {
    return !isNaN(this.$el.find('input[name="extrusion-length"]').val());
  },
  _sendExtrusionCommand: function(direction)
  {
    var data = {
      command: "extrude",
      amount: parseFloat(this.$('input[name="extrusion-length"]').val() * direction),
      speed: parseFloat(this.$('input[name="extrusion-speed"]').val())
    }

    var extruder = this.$('select.extruder-number').val();

    if (extruder) {
      data['tool'] = 'tool'+extruder;
    }

    $.ajax({
      url: API_BASEURL + "printer/tool",
      type: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(data)
    });
  }
});

var FanControlView = Backbone.View.extend({
  el: '.fan-control',
  events: {
    'click button.fan-on': "fanOn",
    'click button.fan-off': "fanOff"
  },
  fanOn: function()
  {
    this._setFanSpeed(255);
    this.$('.fan_icon').addClass('animate-spin');
    this.$('.fans').removeClass('fan-on').addClass('fan-off');
    this.$('.fans').text('OFF');
  },
  fanOff: function()
  {
    this._setFanSpeed(0);
    this.$('.fan_icon').removeClass('animate-spin');
    this.$('.fans').removeClass('fan-off').addClass('fan-on');
    this.$('.fans').text('ON');
  },
  _setFanSpeed: function(speed)
  {
    var data = {
      command: "set",
      tool: 0,
      speed: speed
    }

    $.ajax({
      url: API_BASEURL + "printer/fan",
      type: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(data)
    });
  }
});

var ControlView = Backbone.View.extend({
  el: '#control-view',
  events: {
    'click .back-to-print button': 'resumePrinting',
    'show': 'render'
  },
  tempView: null,
  distanceControl: null,
  xyControlView: null,
  zControlView: null,
  extrusionView: null,
  fanView: null,
  initialize: function()
  {
    this.tempView = new TempView();
    this.distanceControl = new DistanceControl();
    this.xyControlView = new XYControlView({distanceControl: this.distanceControl});
    this.zControlView = new ZControlView({distanceControl: this.distanceControl});
    this.extrusionView = new ExtrusionControlView();
    this.fanView = new FanControlView();

    this.listenTo(app.socketData, 'change:temps', this.updateTemps);
    this.listenTo(app.socketData, 'change:paused', this.onPausedChanged);
  },
  updateTemps: function(s, value)
  {
    if (!this.$el.hasClass('hide')) {
      this.tempView.updateTemps(value);
    }
  },
  render: function()
  {
    this.onPausedChanged(app.socketData, app.socketData.get('paused'));

    this.extrusionView.render();
  },
  resumePrinting: function(e)
  {
    app.setPrinting();
    app.router.navigate("printing", {replace: true, trigger: true});
    app.router.printingView.togglePausePrint(e);

    this.$el.addClass('hide');
  },
  onPrintingProgressChanged: function(model, printingProgress)
  {
    var el = this.$('.back-to-print .filename');

    if (printingProgress && printingProgress.printFileName && printingProgress.printFileName != el.text()) {
      el.text(printingProgress.printFileName)
    }
  },
  onPausedChanged: function(model, paused)
  {
    if (paused) {
      this.listenTo(app.socketData, 'change:printing_progress', this.onPrintingProgressChanged);
      this.$el.addClass('print-paused');
    } else {
      this.stopListening(app.socketData, 'change:printing_progress');

      if (app.socketData.get('printing')) {
        app.router.navigate("printing", {replace: true, trigger: true});
      } else {
        this.$el.removeClass('print-paused');
      }
    }
  }
});
