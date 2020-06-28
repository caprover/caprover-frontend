import Utils from './utils/Utils'

it('does not modify string without gen hex', () => {
    const inputStr = `start_____$$cap_gen____random_hex(4)______$$cap_gen____random_hex(23552)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
    expect(output).toBe(inputStr)
})

it('generate one char', () => {
    const inputStr = `start_____$$cap_gen_random_hex(1)______$$cap_gen___random_hex(23552)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    expect(output.length).toBe(1)
    expect(/^[0-9a-f]+$/i.test(output)).toBe(true)
})

it('generate 16 chars', () => {
    const inputStr = `start_____$$cap_gen_random_hex(16)______$$cap_gen___random_hex(23552)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    expect(output.length).toBe(16)
    expect(/^[0-9a-f]+$/i.test(output)).toBe(true)
})

it('generate 8 chars - two instances', () => {
    const inputStr = `__$$cap_gen_random_hex(16)___$$cap_gen_random_hex(8)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
    expect(/^__[0-9a-f]{16}___[0-9a-f]{8}____$/i.test(output)).toBe(true)
})

it('generate 256 chars', () => {
    const inputStr = `start_____$$cap_gen_random_hex(256)______$$cap_gen___random_hex(23552)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    expect(output.length).toBe(256)
    expect(/^[0-9a-f]+$/i.test(output)).toBe(true)
})

it('does not generate more than 256 chars', () => {
    const inputStr = `start_____$$cap_gen_random_hex(257)______$$cap_gen___random_hex(23552)____`
    const output = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    expect(output.length).toBe(0)
})

it('generate randomly', () => {
    const inputStr = `start_____$$cap_gen_random_hex(5)______$$cap_gen___random_hex(23552)____`
    const output_1 = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    const output_2 = Utils.replaceAllGenRandomForOneClickApp(inputStr)
        .replace('start_____', '')
        .replace('______$$cap_gen___random_hex(23552)____', '')
    expect(output_1 !== output_2).toBeTruthy()
})
