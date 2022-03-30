; CHICKEN-SHOOTER
; 6502-Kurs

; STEUERUNG:
;   a = Kanone nach links bewegen
;   d = Kanone nach rechts bewegen
;   m = M wie Munition verballern
;   z = Zufaellige Bewegungen fuer Huehner umschalten

; Adressen/Variablen/Pointer

; $00/01 = Raumschiff (Bildschirmadresse)
; $02/03 = Projektil (Bildschirmadresse)
; $04 = Projektil-Counter
; $05 = Projektil unterwegs? ($0 = nein, $1 = ja)
; $06 = aktuelles Huhn (Index = $00, $20, $40, ...) wird ...
;       ... jeweils zu $20 addiert, um zur zugehoerigen ...
;       ... Zeropage zu gelangen
; $07
; $08 = Hintergrundfarbe
; $09 = Spassbremse-Counter (zum Verlangsamen des Ablaufs)
; $0A = Kanonenrandfarbe beim Feuern (anstelle weiss)
; $0B
; $0C
; $0D = Zwischenspeicher fuer temporaere Daten
; $0E = Lowbyte Zwischenspeicher fuer temporaere Daten
; $0F = Highbyte Zwischenspeicher fuer temporaere Daten

; $10 = KONSTANTE Raumschiff min links (= $A1)
; $11 = KONSTANTE Raumschiff max rechts (= $BC)
; $12
; $13
; $14 = KONSTANTE Projektil-Counter
; $15
; $16 = Speicheradressen-Offset erstes Huhn (= $00)
; $17 = Speicheradressen-Offset letztes Huhn (= $60)
; $18
; $19 = Spassbremse-Counter (Standard = $00)
; $1A = Kanonenrandfarbe (Standard = $01 = weiss)

; $20 Huhn (Bildschirmadresse) Lowbyte
; $21 Huhn (Bildschirmadresse) Highbyte
; $22 ChickenMove-Counter
; $23 Bewegungsrichtung ($1 = rechts, $ff = links) - wird addiert
; $24 Zufallsbewegung ($0 = nein, $1 = ja)
; $25 Zufallsbewegung-Counter
; $26 ChickAnim Offset Index (0 (-> $1C) oder 1 (-> $1D))
; $27 
; $28 ChickAnim-Counter
; $29 ChickExplode (0 = nein, 1 = ja)
; $2A ChickExplode-Counter (Explosionsverzoegerung fuer's Auge)
; $2B ChickExplode-Explosion-Counter (Anzahl Explosionen)
; $2C ChickDead (0 = nein, 1 = ja)
; $2D Lowbyte ChickRespawn-Counter
; $2E Highbyte ChickRespawn-Counter

; $30 = KONSTANTE Huhn min links
; $31 = KONSTANTE Huhn max rechts
; $32 = KONSTANTE ChickenMove-Counter
; $33
; $34
; $35 = KONSTANTE Zufallsbewegung-Counter
; $36 = KONSTANTE ChickAnim Offset Animation 1 (= $00)
; $37 = KONSTANTE ChickAnim Offset Animation 2 (= $1D)
; $38 = KONSTANTE ChickAnim-Counter
; $39
; $3A = KONSTANTE ChickExplode-Counter
; $3B = KONSTANTE ChickExplode-Explosion-Counter
; $3C
; $3D = KONSTANTE Lowbyte ChickRespawn-Counter
; $3E = KONSTANTE Highbyte ChickRespawn-Counter

; Initialprogrammdaten (Raumschiff, Projektil, etc.)
*=$0000
DCB $A2,$05,$00,$05,$08,$00,$00,$00,$0E,$00,$01
*=$0010
DCB $A1,$BC,$00,$00,$08,$00,$00,$60,$00,$00,$01

; 1. Huhn Daten
*=$0020
DCB $22,$02,$18,$01,$00,$0B,$00,$00,$04,$00,$01,$0F,$00,$FF,$04
*=$0030
DCB $20,$39,$18,$00,$00,$05,$00,$1D,$04,$00,$04,$0F,$00,$FF,$04

; 2. Huhn Daten
*=$0040
DCB $92,$02,$08,$FF,$00,$0B,$00,$00,$02,$00,$01,$0F,$00,$FF,$02
*=$0050
DCB $80,$99,$08,$00,$00,$05,$00,$1D,$02,$00,$04,$0F,$00,$FF,$02

; 3. Huhn Daten
*=$0060
DCB $06,$03,$10,$01,$00,$0B,$00,$00,$03,$00,$01,$0F,$00,$FF,$03
*=$0070
DCB $00,$19,$10,$00,$00,$05,$00,$1D,$03,$00,$04,$0F,$00,$FF,$03

; 4. Huhn Daten
*=$0080
DCB $87,$03,$0A,$FF,$00,$0B,$00,$00,$03,$00,$01,$0F,$00,$FF,$01
*=$0090
DCB $80,$99,$0A,$00,$00,$05,$00,$1D,$02,$00,$04,$0F,$00,$FF,$01


*=$0600
; init
JSR draw_background   ; Hintergrund zeichnen
JSR draw_canon        ; Initialpunkt setzen
LDA $17               ; letztes Huhn als erstes festlegen, ...
STA $06               ; ... damit beim 1. Lauf 1. Huhn aktiv ist

; main
main:
; Spassbremse
    LDA $19
    BEQ main_no_limit
    LDA $09
    BEQ main_reset_limit
    DEC $09
    NOP
    NOP
    JMP main
    main_reset_limit:
    LDA $19
    STA $09
    main_no_limit:
    
; Huehner "durchladen"
    ; naechstes Huhn auswaehlen
    LDA $06           ; aktuelles Huhn
    CMP $17           ; = letztes Huhn?
    BEQ main_select_first_chick
    CLC
    ADC #$20           ; naechstes Huhn
    JMP main_select_chick_done
    main_select_first_chick:
    LDA $16           ; erstes Huhn
    main_select_chick_done:
    STA $06
    TAX

; Huhn bewegen
    LDA $2C, X        ; Huhn tot?
    BNE main_check_chick_respawn
    LDA $22, X
    DEC $22, X        ; Huehnercounter dekrementieren
    BNE main_no_chick_move
    JSR chick_move
    JMP main_no_chick_move
    main_check_chick_respawn:
    LDA $29, X        ; Huhn tot! Explosion?
    BNE main_no_chick_move ; Explosion -> warten bis fertig
    DEC $2D, X        ; ChickRespawn-Counter dekrementieren (lo)
    BNE main_no_chick_move
    LDA $3D, X        ; lo restore
    STA $2D, X
    DEC $2E, X        ; ChickRespawn-Counter dekrementieren (hi)
    BNE main_no_chick_move
    JSR chick_respawn
    main_no_chick_move:

; Projektil bewegen
    LDA $05           ; Projektil unterwegs?
    BEQ main_no_projectile_move
    DEC $04           ; Projektil-Counter dekrementieren
    BNE main_no_projectile_move
    JSR projectile_move
    main_no_projectile_move:

; Explosion
    LDX $06           ; Huhn-Offset
    LDA $29, X        ; Getroffen?
    BEQ main_no_explosion
    DEC $2A, X        ; ChickExplode-Counter dekrementieren
    BNE main_no_explosion
    JSR explode_chick
    main_no_explosion:

; Read keyboard
    LDA $FF           ; Keyboard auslesen
    BEQ main          ; keine Taste
    CMP #$61          ; a
    BEQ main_key_left
    CMP #$64          ; d
    BEQ main_key_right
    CMP #$6D          ; m
    BEQ main_key_fire
    CMP #$4D          ; M
    BEQ main_key_mega_fire
    CMP #$7A          ; z
    BEQ main_key_toggle_random_chick_movement
    JMP main_key_done

    main_key_left:
    JSR left
    JMP main_key_done

    main_key_right:
    JSR right
    JMP main_key_done

    main_key_fire:
    LDA #$0D          ; Schussfarbe = hellgruen
    STA $0A
    JSR fire
    JMP main_key_done

    main_key_mega_fire:
    LDA #$0A          ; Schussfarbe = hellrot
    STA $0A
    JSR mega_fire
    JMP main_key_done
    
    main_key_toggle_random_chick_movement:
    JSR toggle_random_chick_movement
    JMP main_key_done    

    main_key_done:
    LDA #$00          ; Tastaturpuffer leeren
    STA $FF    
JMP main

left:
    DEC $00           ; ein Pixel nach links
    LDA $00           ; Pixel schon ...
    CMP $10           ; ... ganze links? ...
    BNE left_skip     ; falls nicht: ueberspringen
    INC $00
    left_skip:
    JSR draw_canon
RTS

right:
    INC $00           ; ein Pixel nach rechts
    LDA $00           ; Pixel schon ...
    CMP $11           ; ... ganze rechts? ...
    BNE right_skip    ; falls nicht: ueberspringen
    DEC $00
    right_skip:
    JSR draw_canon    
RTS

fire:
    LDA $05           ; Noch Projektil unterwegs? ...
    BNE fire_no       ; ... dann nicht feuern
    LDA #$05          ; Highbyte Kanonenspitze = Projektil
    STA $03
    LDA $00           ; Lowbyte Raumschiff laden
    SEC
    SBC #$1F          ; Lowbyte Projektil erzeugen
    BCS fire_no_change
    DEC $03           ; Page-Wechsel Highbyte
    fire_no_change:
    STA $02           ; Lowbyte Projektil speichern
    LDY #$00          ; Fake-Pointer
    LDA $0A           ; Schussfarbe
    STA ($02), Y
    LDA #$01          ; Projektil ...
    STA $05           ; ... unterwegs
    JSR draw_canon
    fire_no:
RTS

toggle_random_chick_movement:
    LDX $16           ; erstes Huhn
    toggle_random_chick_movement_loop:
        LDA $24, X
        EOR #$01      ; Wert invertieren
        STA $24, X
        CPX $17       ; letztes Huhn
        BEQ toggle_random_chick_movement_loop_exit
        TXA
        CLC
        ADC #$20      ; naechstes Huhn
        TAX
        JMP toggle_random_chick_movement_loop
    toggle_random_chick_movement_loop_exit:
RTS

mega_fire1:
    JSR fire
    mega_fire1_loop:
        LDA #01
        STA $05       ; Projektil unterwegs!
        JSR projectile_move
        LDA $03       ; Highbyte Projektil
        CMP #$01      ; Projektil aus Bildschirm raus?
    BNE mega_fire1_loop
RTS

mega_fire:
    JSR fire
    mega_fire_loop:
        LDA $02       ; Lowbyte Projektil
        SEC
        SBC #$20      ; eine Zeile hoeher
        BCS mega_fire_loop_save_and_skip
        STA $02       ; Lowbyte Projektil sichern
        DEC $03       ; Highbyte Projektil
        LDA #$01
        CMP $03
        BEQ mega_fire_loop_exit
        JMP mega_fire_loop_skip
        mega_fire_loop_save_and_skip:
        STA $02       ; Lowbyte Projektil sichern
        mega_fire_loop_skip:
        LDA #$01
        STA $05       ; Projektil unterwegs!
        JSR pixel_collision
        LDY #$00      ; Fake-Pointer
        LDA #$0A      ; Schussfarbe: hellrot
        STA ($02), Y
    JMP mega_fire_loop
    mega_fire_loop_exit:
    LDA #$00
    STA $05           ; kein Projektil unterwegs!
    LDA #$01          ; Farbe: weiss
    STA $0A           ; Kanonenrandfarbe
    JSR draw_background
    JSR draw_canon
RTS

pixel_collision:
    LDY #$00          ; Fake-Pointer
    LDA ($02), Y      ; lade Pixel von ($02-$03)
    CMP $08           ; Hintergrundfarbe
    BEQ pixel_collision_exit ; Hintergrund? -> keine Kollision
    
    ; Welches Huhn wurde getroffen?
    LDA #$00
    STA $05           ; kein Projektil unterwegs
    LDA $1A           ; Kanonenrandfarbe ...
    STA $0A           ; ... zuruecksetzen
    JSR draw_canon
    LDX $16           ; erstes Huhn
    pixel_collision_loop:
        LDA $21, X    ; Highbyte Huhn
        CMP $03       ; Highbyte Projektil
        BNE pixel_collision_loop_next
        LDA $02       ; Lowbyte Projektil
        SEC           ; min links abziehen. Ergebnis > 0, ...
        SBC $30, X    ; ... wenn es das richtige Huhn ist
        BCC pixel_collision_loop_next
        SBC #$40      ; zwei Zeilen abziehen. Ergebnis < 0, ...
                      ; ... wenn es das richtige Huhn ist
        BCS pixel_collision_loop_next
        
        ; Richtiges Huhn gefunden
        LDA #$01      ; Explosion ...
        STA $29, X    ; ... merken
        STA $2C, X    ; "Er ist tot, Jim!"
        JMP pixel_collision_exit
        
        pixel_collision_loop_next:
        ; Folgende Bedingung sollte nie wahr werden, denn ...
        ; ... sonst wurde ein Pixel getroffen, der zu ...
        ; ... keinem Huhn gehoert.
        CPX $17       ; letztes Huhn?
        BEQ pixel_collision_exit
        ; naechstes Huhn auswaehlen
        TXA
        CLC
        ADC #$20
        TAX
    JMP pixel_collision_loop
pixel_collision_exit:
RTS

randomize:
    LDA #$0F          ; Binaer 00001111
    AND $FE           ; Zufallszahl von 0 bis 15
    TAY
    AND #$0C          ; Zahl groeßer 3? Maske 00001100
    BNE randomize_ok
    TYA
    ORA #$04          ; Bit 2 (00000100) setzen
    TAY
    randomize_ok:
	LDX $06           ; Huhn-Offset
    STY $25, X
RTS

draw_canon:
    LDX #$00
    draw_canon_loop:
    LDY canon, X
    CPY #$FF
    BEQ draw_canon_end
    INX
    LDA canon, X
    CMP #$10          ; transparent?
    BNE draw_canon_edge
    LDA $08           ; Hintergrundfarbe
    JMP draw_canon_draw
    draw_canon_edge:
    CMP #$01          ; weiss? (= Rand)
    BNE draw_canon_draw
    LDA $0A           ; Kanonenrandfarbe
    draw_canon_draw:
    STA ($00), Y
    INX
    JMP draw_canon_loop
    draw_canon_end:
RTS

draw_chick:
    LDX $06           ; Huhn-Offset
    LDY $26, X        ; Offset-Index laden
    DEC $28, X        ; ChickAnim-Counter
    BNE draw_chick_no_change
    TYA               ; ChickAnim ...
    EOR #$01          ; ... Offset-Index ...
    STA $26, X        ; ... umkehren
    TAY
    LDA $38, X        ; ChickAnim-Counter ...
    STA $28, X        ; ... zuruecksetzen
    draw_chick_no_change:
    LDA $20, X        ; Position Huhn
    STA $0E           ; zwischenspeichern
    LDA $21, X
    STA $0F
    LDY $26, X        ; ChickAnim Offset Index
    LDX $36, Y        ; ChickAnim Offset
    draw_chick_loop:
        LDY chicken, X
        CPY #$FF
        BEQ draw_chick_end
        INX
        LDA chicken, X
        CMP #$10      ; transparent?
        BNE draw_chick_loop_draw
        LDA $08       ; Hintergrundfarbe
        draw_chick_loop_draw:
        STA ($0E), Y
        INX
    JMP draw_chick_loop
    draw_chick_end:
RTS

explode_chick:
    LDX $06           ; Huhn-Offset
    DEC $2B, X
    BNE explode_chick_go
    ; Explosion fertig, Variablen zuruecksetzen
    LDA #$01          ; ChickExplode-Counter auf 1, damit es ...
    STA $2A, X        ; ... sofort nach Einschlag explodiert
    LDA $3B, X        ; ChickExplode-Explosion-Counter
    STA $2B, X
    LDA #$00
    STA $29, X        ; ChickExplode = 0
    ; Explosionsmatsche loeschen
    LDA $20, X        ; Huhn-Offset Lowbyte
    STA $0E           ; zwischenspeichern
    LDA $21, X
    STA $0F
    LDY #$47          ; Offset
    explode_chick_finish_loop:
        DEY
        LDA $08      ; Hintergrundfarbe
        STA ($0E), Y
        TYA
        AND #$0F      ; hintere 7 runtergezaehlt?
        BNE explode_chick_finish_loop
        TYA
        BEQ explode_chick_end  ; alles 0?
        SEC
        SBC #$19      ; vorherige Zeile
        TAY
    JMP explode_chick_finish_loop
    explode_chick_go:
    LDA $20, X        ; Huhn-Offset Lowbyte
    STA $0E           ; zwischenspeichern
    LDA $21, X
    STA $0F
    LDX #$01          ; Anzahl der Zufallspixel pro Durchlauf
    explode_chick_loop:
        ; Zufallszahl von 0 bis 13 als Koordinate im DCB chicken
        LDA $FE       ; Zufallszahl von 0 bis 255
        AND #$0F      ; Zufallszahl von 0 bis 15
        TAY           ; Zahl sichern
        SEC
        SBC #$0E      ; Zahl >= 14?
        BCS explode_chick_loop_number_ok
        TYA           ; Korrigierte Zahl nehmen
        explode_chick_loop_number_ok:
        ASL           ; Zahl mit 2 multiplizieren
        TAY
        
        ; Animationsoffset wird vernachlaessigt, da im ...
        ; ... Moment die Zeilen und Spalten in allen ...
        ; ... "Frames" gleich in der Anzahl sind.
        LDA chicken, Y  ; Zufallsoffset fuer Matsche
        TAY
        
        LDA $FE       ; Zufallsfarbe
        STA ($0E), Y  ; Matsche zeichnen
        DEX           ; Schleifenzaehler dekrementieren
    BNE explode_chick_loop
    
    LDX $06           ; Huhn-Offset
    LDA $3A, X        ; ChickExplode-Counter
    STA $2A, X
    explode_chick_end:
RTS  

chick_respawn:
    LDX $06           ; Huhn-Offset
    LDA $30, X        ; min Huhn links
    STA $0F
    LDA $FE           ; Zufallszahl
    AND #$0F          ; von 0 bis 15
    CLC
    ADC #$04          ; von 4 bis 19
    CLC
    ADC $0F
    STA $20, X        ; lowbyte Huhn
    LDA $23, X        ; Richtung ...
    EOR #$FF          ; ...
    STA $23, X        ; ...
    INC $23, X        ; ... umkehren
    LDA #$00          ; Huhn nicht mehr tot
    STA $2C, X
    LDA $3E, X        ; ChickRespawn-Counter zuruecksetzen (hi)
    STA $2E, X
RTS

chick_move:
    ; chick_move wird _nur_ von main aus aufgerufen und dort ...
    ; ... ist in X immer noch der Speicheradressen-Offset ...
    ; ... des aktuellen Huhns enthalten, daher hier kein ...
    LDX $06

    ; Huhn bewegen
    LDA $23, X        ; Bewegung ...
    STA $0F           ; ... zwischenspeichern
    LDA $20, X        ; Lowbyte Huhn
    CLC
    ADC $0F           ; bewegen (rechts oder links)
    STA $20, X

    ; Zufallsbewegung
    LDA $24, X        ; Zufallsbewegung?
    BEQ chick_move_normal
    DEC $25, X        ; Zufallsbewegung-Counter dekrementieren
    BNE chick_move_normal
    LDA #$01          ; Vergleicher Zufallszahl (ungerade?)
    AND $FE           ; Zufallszahl ungerade?
    BEQ chick_move_no_direction_toggle
    LDA $23, X        ; Bewegungsrichtung ...
    EOR #$FF          ; ... invertieren
    STA $23, X
    INC $23, X
    chick_move_no_direction_toggle:
    ;LDA $35, X        ; Zufallsbewegungscounter zuruecksetzen
    ;STA $25, X
    JSR randomize
    chick_move_normal:

    ; Randpruefung
    LDA $20, X
    CMP $31, X        ; ganz rechts?
    BNE chick_move_check_left
    LDY #$FF          ; Richtung: links
    STY $23, X
    chick_move_check_left:
    CMP $30, X        ; ganz links?
    BNE chick_move_keep_direction
    LDY #$01          ; Richtung: rechts
    STY $23, X
    chick_move_keep_direction:
    JSR draw_chick
    LDX $06           ; Huhn-Offset
    LDA $32, X        ; Chickencounter ...
    STA $22, X        ; ... erneuern
RTS

projectile_move:
    ; Schusspixel loeschen
    LDY #$00          ; Fake-Pointer
    LDA $08           ; Hintergrundfarbe
    STA ($02), Y

    LDA $02           ; Schuss-Y-Koordinate laden
    ; neuen Schusspixel berechnen
    SEC
    SBC #$20          ; eine Zeile hoeher
    BCS projectile_move_no_change
                      ; letzte K. groesser -> noch in Page

    ; sonst: Highbyte dekrementieren
    DEC $03           ; eine Page hoeher
    LDX $03           ; Highbyte Projektil
    CPX #$01          ; Schuss schon oben angekommen?
    BNE projectile_move_no_change
    LDA #$00          ; kein Projektil ...
    STA $05           ; ... unterwegs
    LDA $1A           ; Kanonenrandfarbe ...
    STA $0A           ; ... zuruecksetzen
    JSR draw_canon
    JMP projectile_move_end

    projectile_move_no_change:
    STA $02           ; Schuss-Y-Koordinate sichern
    JSR pixel_collision
    LDA $05           ; Projektil immer noch unterwegs?
    BEQ projectile_move_reset

    ; neuen Schusspixel zeichnen
    LDA $0A           ; Schussfarbe
    STA ($02), Y      ; Schusspixel zeichnen
    JMP projectile_move_end

    projectile_move_reset:
    LDA $1A           ; Kanonenrandfarbe ...
    STA $0A           ; ... zuruecksetzen
    JSR draw_canon

    projectile_move_end:

    ; Projektil-Counter erneuern
    LDA $14
    STA $04
RTS

draw_background:
    LDA #$02          ; Highbyte Bildschirm
    STA $0F
    TAX
    LDA #$00          ; Lowbyte Bildschirm
    STA $0E
    TAY
    LDA $08           ; Hintergrundfarbe
    draw_background_loop:
        STA ($0E), Y  ; Pixel zeichnen
        INY
        BNE draw_background_loop
        INC $0F
        INX
        CPX #$06      ; Bildschirm zuende?
        BNE draw_background_loop
RTS

canon:
;DCB: offset, Farbe ($10 = transparent)
DCB $00,$10            ; oberste Zeile
DCB $01,$1
DCB $02,$10
DCB $1F,$10            ; mittlere Zeile
DCB $20,$1
DCB $21,$7
DCB $22,$1
DCB $23,$10
DCB $3E,$10            ; unterste Zeile
DCB $3F,$1
DCB $40,$7
DCB $41,$A
DCB $42,$7
DCB $43,$1
DCB $44,$10
DCB $FF

chicken:
; DCB: offset, Farbe ($10 = transparent)
; Animation 1 (Fluegel unten)
DCB $00,$10            ; erste Zeile
DCB $01,$10
DCB $02,$9
DCB $03,$10
DCB $04,$9
DCB $05,$10
DCB $06,$10
DCB $20,$10            ; zweite Zeile  
DCB $21,$9
DCB $22,$10
DCB $23,$9             ; Schnabel / Kopf
DCB $24,$10
DCB $25,$9
DCB $26,$10
DCB $FF
; offset = 29 (= $1D)
; Animation 2 (Fluegel oben)
DCB $00,$10            ; erste Zeile
DCB $01,$9
DCB $02,$9
DCB $03,$10
DCB $04,$9
DCB $05,$9
DCB $06,$10
DCB $20,$10            ; zweite Zeile  
DCB $21,$10
DCB $22,$10
DCB $23,$9             ; Schnabel / Kopf
DCB $24,$10
DCB $25,$10
DCB $26,$10
DCB $FF
