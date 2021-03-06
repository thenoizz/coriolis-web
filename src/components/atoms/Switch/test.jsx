/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// @flow

import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import TestWrapper from '../../../utils/TestWrapper'
import Switch from '.'

const wrap = props => new TestWrapper(shallow(<Switch {...props} />), 'switch')

describe('Switch Component', () => {
  it('handles change event', () => {
    let onChange = sinon.spy()
    let wrapper = wrap({ onChange, checked: false })
    wrapper.find('input').simulate('click')
    expect(onChange.args[0][0]).toBe(true)
  })

  it('dispatches `null` if in tri-state `false` and clicked', () => {
    let onChange = sinon.spy()
    let wrapper = wrap({ onChange, checked: false, triState: true })
    wrapper.find('input').simulate('click')
    expect(onChange.args[0][0]).toBe(null)
  })

  it('dispatches `true` if in tri-state `null` after `false` and clicked', () => {
    let onChange = sinon.spy()
    let wrapper = wrap({ onChange, checked: false, triState: true })
    wrapper.find('input').simulate('click')
    wrapper.find('input').simulate('click')
    expect(onChange.args[0][0]).toBe(null)
  })
})
