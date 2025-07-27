window.onload = function () {
  var canvas = $("#wrapper-canvas").get(0);
  var dimensions = {
    width: $(window).width(),
    height: $(window).height()
  };

  Matter.use('matter-attractors');
  Matter.use('matter-wrap');

  var config = {
    numShapes: 60,
    minSize: 10,
    maxSize: 40,
    attractionStrength: 1e-6,
    shapeColor: '#fff',
    attractorColor: '#000',
    maxSides: 6,
    minSides: 3,
    frictionAir: 0.02,
    reset: function () {
      resetWorld();
    }
  };

  var engine, runner, render, world, attractiveBody;

  function createWorld() {
    engine = Matter.Engine.create();
    engine.world.gravity.scale = 0;

    render = Matter.Render.create({
      element: canvas,
      engine: engine,
      options: {
        width: dimensions.width,
        height: dimensions.height,
        wireframes: false,
        background: 'transparent'
      }
    });

    runner = Matter.Runner.create();
    world = engine.world;

    attractiveBody = Matter.Bodies.circle(
      render.options.width / 2,
      render.options.height / 2,
      Math.max(dimensions.width / 4, dimensions.height / 4) / 2,
      {
        isStatic: true,
        render: {
          fillStyle: '#000',
          strokeStyle: config.attractorColor,
          lineWidth: 2
        },
        plugin: {
          attractors: [
            function (bodyA, bodyB) {
              return {
                x: (bodyA.position.x - bodyB.position.x) * config.attractionStrength,
                y: (bodyA.position.y - bodyB.position.y) * config.attractionStrength,
              };
            }
          ]
        }
      }
    );
    Matter.World.add(world, attractiveBody);

    addShapes();

    var mouse = Matter.Mouse.create(render.canvas);
    Matter.Events.on(engine, 'afterUpdate', function () {
      if (!mouse.position.x) return;
      Matter.Body.translate(attractiveBody, {
        x: (mouse.position.x - attractiveBody.position.x) * 0.12,
        y: (mouse.position.y - attractiveBody.position.y) * 0.12
      });
    });

    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Mouse press animation
    let isPressed = false;
    let pressStartTime = 0;
    const originalRadius = attractiveBody.circleRadius;

    render.canvas.addEventListener('mousedown', () => {
      isPressed = true;
      pressStartTime = Date.now();
      Matter.Body.scale(attractiveBody, 0.5, 0.5);
    });

    render.canvas.addEventListener('mouseup', () => {
      if (!isPressed) return;
      isPressed = false;

      const pressDuration = Date.now() - pressStartTime;
      const speedFactor = Math.min(2, Math.max(0.5, 1000 / pressDuration));

      anime({
        targets: { radius: attractiveBody.circleRadius },
        radius: originalRadius,
        duration: 1000 / speedFactor,
        easing: 'easeOutElastic',
        update: function (anim) {
          const current = attractiveBody.circleRadius;
          const target = anim.animations[0].currentValue;
          const scale = target / current;
          Matter.Body.scale(attractiveBody, scale, scale);
        }
      });
    });

    return { engine, runner, render };
  }

  function addShapes() {
    for (var i = 0; i < config.numShapes; i++) {
      let x = Matter.Common.random(0, render.options.width);
      let y = Matter.Common.random(0, render.options.height);
      let s = Matter.Common.random(config.minSize, config.maxSize);
      let sides = Math.floor(Matter.Common.random(config.minSides, config.maxSides + 1));

      var shape = Matter.Bodies.polygon(x, y, sides, s, {
        mass: s / 20,
        friction: 0,
        frictionAir: config.frictionAir,
        render: {
          fillStyle: config.shapeColor,
          strokeStyle: '#fff',
          lineWidth: 2
        },
        plugin: {
          wrap: {
            min: { x: 0, y: 0 },
            max: { x: render.options.width, y: render.options.height }
          }
        }
      });

      Matter.World.add(world, shape);
    }
  }

  function resetWorld() {
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);
    Matter.World.add(world, attractiveBody);
    addShapes();
  }

  function updateAttractorColor() {
    attractiveBody.render.strokeStyle = config.attractorColor;
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function setWindowSize() {
    dimensions.width = $(window).width();
    dimensions.height = $(window).height();
    render.canvas.width = dimensions.width;
    render.canvas.height = dimensions.height;
    Matter.Body.setPosition(
      attractiveBody,
      { x: dimensions.width / 2, y: dimensions.height / 2 }
    );
  }

  // GUI (you can hide this section if not using dat.GUI)
  var gui = new dat.GUI();
  gui.close();

  var shapeFolder = gui.addFolder('Shapes');
  shapeFolder.add(config, 'numShapes', 10, 1000, 1).name('Number of Shapes').onChange(resetWorld);
  shapeFolder.add(config, 'minSize', 5, 20, 1).name('Min Size').onChange(resetWorld);
  shapeFolder.add(config, 'maxSize', 20, 60, 1).name('Max Size').onChange(resetWorld);
  shapeFolder.add(config, 'minSides', 3, 10, 1).name('Min Sides').onChange(resetWorld);
  shapeFolder.add(config, 'maxSides', 3, 10, 1).name('Max Sides').onChange(resetWorld);
  shapeFolder.addColor(config, 'shapeColor').name('Shape Color').onChange(resetWorld);

  var attractorFolder = gui.addFolder('Attractor');
  attractorFolder.add(config, 'attractionStrength', 1e-7, 1e-5, 1e-7).name('Attraction Strength');
  attractorFolder.addColor(config, 'attractorColor').name('Attractor Color').onChange(updateAttractorColor);

  var physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(config, 'frictionAir', 0, 1, 0.01).name('Air Friction').onChange(function (value) {
    Matter.Composite.allBodies(world).forEach(function (body) {
      if (!body.isStatic) {
        body.frictionAir = value;
      }
    });
  });

  var controlFolder = gui.addFolder('Control');
  controlFolder.add(config, 'reset').name('Reset World');

  function resizeGUI() {
    const guiContainer = document.querySelector('.dg.ac');
    if (guiContainer) {
      guiContainer.style.width = window.innerWidth + 'px';
    }
  }

  window.addEventListener('resize', resizeGUI);
  resizeGUI();

  let m = createWorld();
  setWindowSize();
  $(window).resize(debounce(setWindowSize, 250));
};
