'use strict';

const bundeslaenderMapPanel = document.getElementById('BundeslaenderMapPanel');
const bundeslaenderMapElement = document.getElementById('BundeslaenderMap');
const bundeslaenderMapFeedback = document.getElementById('BundeslaenderMapFeedback');

let bundeslaenderGeoJsonData = null;
let bundeslaenderMap = null;
let bundeslaenderLayer = null;

const bundeslaenderMapStyle = {
    color: '#b7791f',
    weight: 1,
    fillColor: '#d4a017',
    fillOpacity: 0.24
};

function isBundeslaenderMapQuestion(question) {
    return !!(question && question.type === 'map-click');
}

function normalizeStateName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

async function ensureBundeslaenderGeoJsonLoaded() {
    if (bundeslaenderGeoJsonData) {
        return bundeslaenderGeoJsonData;
    }

    const response = await fetch('data/bundeslaender.geojson');
    if (!response.ok) {
        throw new Error('Bundeslaender-Karte konnte nicht geladen werden.');
    }

    bundeslaenderGeoJsonData = await response.json();
    return bundeslaenderGeoJsonData;
}

function resetBundeslaenderStyles() {
    if (!bundeslaenderLayer) {
        return;
    }

    bundeslaenderLayer.eachLayer(function (layer) {
        layer.setStyle(bundeslaenderMapStyle);
    });
}

function hideBundeslaenderMapQuestion() {
    if (bundeslaenderMapPanel) {
        bundeslaenderMapPanel.hidden = true;
    }

    if (bundeslaenderMapFeedback) {
        bundeslaenderMapFeedback.textContent = '';
    }
}

function evaluateBundeslandSelection(clickedName, layer) {
    if (answerCheckInProgress || !currentQuestion || !isBundeslaenderMapQuestion(currentQuestion)) {
        return;
    }

    answerCheckInProgress = true;

    const clicked = normalizeStateName(clickedName);
    const expected = normalizeStateName(currentQuestion.targetName);
    const isCorrect = clicked === expected;

    if (isCorrect) {
        correctCount += 1;
    } else {
        wrongCount += 1;
    }

    updateScoreDisplay();

    if (layer) {
        layer.setStyle({
            fillColor: isCorrect ? '#22c55e' : '#ef4444',
            fillOpacity: 0.85
        });
    }

    if (bundeslaenderMapFeedback) {
        if (isCorrect) {
            bundeslaenderMapFeedback.textContent = 'Richtig: ' + clickedName;
        } else {
            bundeslaenderMapFeedback.textContent = 'Falsch';
        }
    }

    window.setTimeout(function () {
        removeCurrentQuestionFromRemaining();
        showNextQuestion(currentCategory);
        answerCheckInProgress = false;
    }, 550);
}

async function renderBundeslaenderMapQuestion(question) {
    hideAnswerButtons();

    questionText.textContent = question.q;

    if (!bundeslaenderMapPanel || !bundeslaenderMapElement) {
        questionText.textContent = 'Die Kartenansicht ist nicht verfügbar.';
        return;
    }

    if (!window.L || typeof window.L.map !== 'function') {
        questionText.textContent = 'Kartenbibliothek konnte nicht geladen werden.';
        return;
    }

    try {
        const geoJson = await ensureBundeslaenderGeoJsonLoaded();

        bundeslaenderMapPanel.hidden = false;
        if (bundeslaenderMapFeedback) {
            bundeslaenderMapFeedback.textContent = 'Klicke auf: ' + (question.targetName || 'ein Bundesland');
        }

        if (!bundeslaenderMap) {
            bundeslaenderMap = L.map(bundeslaenderMapElement, {
                attributionControl: false,
                zoomControl: true,
                scrollWheelZoom: false,
                dragging: true
            });
        }

        if (bundeslaenderLayer) {
            bundeslaenderMap.removeLayer(bundeslaenderLayer);
        }

        bundeslaenderLayer = L.geoJSON(geoJson, {
            style: bundeslaenderMapStyle,
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', function () {
                    layer.setStyle({ fillOpacity: 0.34 });
                });

                layer.on('mouseout', function () {
                    resetBundeslaenderStyles();
                });

                layer.on('click', function () {
                    const props = feature && feature.properties ? feature.properties : {};
                    const clickedName = props.name || '';
                    evaluateBundeslandSelection(clickedName, layer);
                });
            }
        }).addTo(bundeslaenderMap);

        bundeslaenderMap.fitBounds(bundeslaenderLayer.getBounds(), {
            padding: [10, 10]
        });

        window.setTimeout(function () {
            bundeslaenderMap.invalidateSize();
        }, 0);
    } catch (error) {
        questionText.textContent = 'Fehler beim Laden der Karte: ' + error.message;
        hideBundeslaenderMapQuestion();
    }
}